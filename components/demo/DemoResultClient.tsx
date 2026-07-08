"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Download, Loader2, RefreshCcw } from "lucide-react";
import { ProtectedDemoImage } from "@/components/ProtectedDemoImage";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { parseJsonResponse, toUserFacingError } from "@/lib/api/parseJsonResponse";
import { AUTH_FROM_RESULT_KEY, GUEST_ID_KEY, INTENDED_ACTION_KEY, INTENDED_GENERATION_KEY } from "@/lib/guest";
import { reachGoal } from "@/lib/metrika";
import { useBlockUnauthenticatedImageShortcuts } from "@/components/demo/useBlockUnauthenticatedImageShortcuts";
import type { ProductCardResult } from "@/types/product-card";

type DemoResult = {
  id: string;
  status: string;
  card?: ProductCardResult;
  previewUrl: string;
  downloadOriginalUrl?: string;
  originalAvailable: boolean;
};

type IntendedAction = "downloadOriginal" | "moreCards" | "createNew";

export function DemoResultClient({ generationId }: { generationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [guestId, setGuestId] = useState("");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [autoActionDone, setAutoActionDone] = useState(false);
  const resultViewTrackedRef = useRef(false);

  useBlockUnauthenticatedImageShortcuts(isAuthenticated);

  useEffect(() => {
    const fromQuery = searchParams.get("guestId");
    const fromStorage = window.localStorage.getItem(GUEST_ID_KEY);
    const nextGuestId = fromStorage || fromQuery || "";

    if (fromQuery && !fromStorage) {
      window.localStorage.setItem(GUEST_ID_KEY, fromQuery);
    }

    setGuestId(nextGuestId);
  }, [searchParams]);

  const previewSrc = useMemo(() => {
    if (!result) return "";
    const params = new URLSearchParams();
    if (guestId) params.set("guestId", guestId);
    params.set("v", result.originalAvailable ? "auth" : "demo");
    return `${result.previewUrl}?${params.toString()}`;
  }, [guestId, result]);

  const loadResult = useCallback(async () => {
    if (!guestId && !isAuthenticated) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (guestId) params.set("guestId", guestId);
      const response = await fetch(`/api/generations/${generationId}/result?${params.toString()}`, {
        headers: guestId ? { "x-marketcard-guest-id": guestId } : undefined,
        cache: "no-store"
      });
      const data = await parseJsonResponse<DemoResult & { error?: string }>(
        response,
        "Не удалось открыть демо-результат. Попробуйте обновить страницу."
      );

      if (!response.ok) {
        throw new Error(data.error || "Не удалось открыть демо-результат.");
      }

      setResult(data);
      if (!resultViewTrackedRef.current) {
        resultViewTrackedRef.current = true;
        trackMarketingEvent("demo_result_view", {
          generationId,
          originalAvailable: data.originalAvailable
        });
      }
    } catch (caught) {
      setError(toUserFacingError(caught, "Не удалось открыть демо-результат. Попробуйте обновить страницу."));
    } finally {
      setLoading(false);
    }
  }, [generationId, guestId, isAuthenticated]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const startedFromResult = window.localStorage.getItem(AUTH_FROM_RESULT_KEY);
    if (startedFromResult !== generationId) return;

    window.localStorage.removeItem(AUTH_FROM_RESULT_KEY);
    trackMarketingEvent("auth_completed_from_result", { generationId });
  }, [generationId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !guestId) return;

    setMigrating(true);
    fetch("/api/generations/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId })
    })
      .then(() => loadResult())
      .finally(() => setMigrating(false));
  }, [guestId, isAuthenticated, loadResult]);

  useEffect(() => {
    if (!isAuthenticated || !result?.originalAvailable || autoActionDone) return;

    const intended =
      (searchParams.get("afterAuth") as IntendedAction | null) ||
      (window.localStorage.getItem(INTENDED_ACTION_KEY) as IntendedAction | null);
    const intendedGenerationId = window.localStorage.getItem(INTENDED_GENERATION_KEY);

    if (intendedGenerationId && intendedGenerationId !== generationId) return;

    setAutoActionDone(true);
    window.localStorage.removeItem(INTENDED_ACTION_KEY);
    window.localStorage.removeItem(INTENDED_GENERATION_KEY);

    if (intended === "downloadOriginal") {
      downloadOriginal();
      return;
    }

    if (intended === "moreCards") {
      router.push("/cabinet#create");
      return;
    }

    if (intended === "createNew") {
      router.push("/#hero-mini-generator");
    }
  }, [autoActionDone, generationId, isAuthenticated, result?.originalAvailable, router, searchParams]);

  async function downloadOriginal() {
    trackMarketingEvent("download_original_click", {
      generationId,
      authenticated: isAuthenticated
    });

    if (!result?.downloadOriginalUrl) {
      requireAuth("downloadOriginal");
      return;
    }

    const response = await fetch(result.downloadOriginalUrl, { cache: "no-store" });

    if (response.status === 401) {
      requireAuth("downloadOriginal");
      return;
    }

    if (!response.ok) {
      setError("Не удалось скачать оригинал.");
      return;
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, `marketcard-original-${generationId}.png`);
    reachGoal("download_png", { source: "original_after_auth" });
  }

  function requireAuth(action: IntendedAction) {
    window.localStorage.setItem(INTENDED_ACTION_KEY, action);
    window.localStorage.setItem(INTENDED_GENERATION_KEY, generationId);
    window.localStorage.setItem(AUTH_FROM_RESULT_KEY, generationId);
    if (guestId) {
      window.localStorage.setItem(GUEST_ID_KEY, guestId);
    }

    trackMarketingEvent("auth_started_from_result", { generationId, action });
    router.push(`/login?callbackUrl=${encodeURIComponent(`/generations/${generationId}?afterAuth=${action}`)}`);
  }

  if (loading || migrating) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-5">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-accent" size={34} />
          <p className="mt-4 text-sm font-bold text-muted">{migrating ? "Открываем доступ к оригиналу..." : "Загружаем результат..."}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-5">
        <div className="w-full max-w-xl rounded-[22px] border border-clay bg-card p-6 text-center">
          <Alert variant="error">{error || "Не удалось открыть демо-результат."}</Alert>
          <Link className="mt-5 inline-flex" href="/#hero-mini-generator">
            <Button type="button">
              <RefreshCcw size={17} />
              Попробовать снова
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-ink md:text-5xl">Ваша карточка готова 🎉</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-muted">
            Это демо с защитной меткой. Войдите, чтобы скачать карточку без водяного знака.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="rounded-[22px] border border-clay bg-card p-4 shadow-soft md:p-5">
            <ProtectedDemoImage alt={result.card?.title || "Демо-карточка MarketCard AI"} className="mx-auto max-w-[620px]" src={previewSrc} />
          </div>

          <aside className="rounded-[22px] border border-clay bg-card p-5">
            {!result.originalAvailable ? (
              <div className="mb-4 rounded-[16px] border border-accent/20 bg-accent/10 p-4 text-sm font-semibold leading-relaxed text-ink">
                Войдите, чтобы скачать карточку без водяного знака.
              </div>
            ) : null}

            <div className="grid gap-3">
              <Button onClick={downloadOriginal} type="button">
                <Download size={17} />
                Скачать оригинал
              </Button>
              <Button
                onClick={() => {
                  if (!result.originalAvailable) {
                    requireAuth("moreCards");
                    return;
                  }
                  router.push("/cabinet#create");
                }}
                type="button"
                variant="secondary"
              >
                Сделать ещё карточки
                <ArrowRight size={17} />
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  if (!result.originalAvailable) {
                    requireAuth("createNew");
                    return;
                  }
                  router.push("/#hero-mini-generator");
                }}
                type="button"
                variant="ghost"
              >
                Создать новую
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
