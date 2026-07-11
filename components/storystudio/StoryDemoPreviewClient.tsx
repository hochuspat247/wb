"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, BookOpen, Loader2, Lock, Shield, Sparkles, Users } from "lucide-react";
import { useBlockUnauthenticatedTextShortcuts } from "@/components/demo/useBlockUnauthenticatedTextShortcuts";
import { ProtectedDemoText } from "@/components/storystudio/ProtectedDemoText";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { Button } from "@/components/ui/Button";
import { parseJsonResponse, toUserFacingError } from "@/lib/api/parseJsonResponse";
import {
  STORY_AUTH_FROM_RESULT_KEY,
  STORY_GUEST_ID_KEY,
  STORY_INTENDED_STORY_KEY,
  buildStoryCabinetFromDemoUrl
} from "@/lib/guest";
import type { StoryProject } from "@/types/storystudio";

type DemoStoryResult = {
  id: string;
  status: string;
  story: StoryProject;
  isDemo: boolean;
};

export function StoryDemoPreviewClient({ storyId }: { storyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [guestId, setGuestId] = useState("");
  const [result, setResult] = useState<DemoStoryResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const resultViewTrackedRef = useRef(false);

  useBlockUnauthenticatedTextShortcuts(isAuthenticated);

  useEffect(() => {
    const fromQuery = searchParams.get("guestId");
    const fromStorage = window.localStorage.getItem(STORY_GUEST_ID_KEY);
    const nextGuestId = fromStorage || fromQuery || "";

    if (fromQuery && !fromStorage) {
      window.localStorage.setItem(STORY_GUEST_ID_KEY, fromQuery);
    }

    setGuestId(nextGuestId);
  }, [searchParams]);

  const loadResult = useCallback(async () => {
    if (!guestId && !isAuthenticated) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (guestId) params.set("guestId", guestId);
      const response = await fetch(`/api/storystudio/demo/${storyId}?${params.toString()}`, {
        headers: guestId ? { "x-storystudio-guest-id": guestId } : undefined,
        cache: "no-store"
      });
      const data = await parseJsonResponse<DemoStoryResult & { error?: string }>(
        response,
        "Не удалось открыть превью истории."
      );

      if (!response.ok) {
        throw new Error(data.error || "Не удалось открыть превью истории.");
      }

      setResult(data);
      if (!resultViewTrackedRef.current) {
        resultViewTrackedRef.current = true;
      }
    } catch (caught) {
      setError(toUserFacingError(caught, "Не удалось открыть превью истории."));
    } finally {
      setLoading(false);
    }
  }, [storyId, guestId, isAuthenticated]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const startedFromResult = window.localStorage.getItem(STORY_AUTH_FROM_RESULT_KEY);
    if (startedFromResult !== storyId) return;

    window.localStorage.removeItem(STORY_AUTH_FROM_RESULT_KEY);
    router.replace(buildStoryCabinetFromDemoUrl(storyId));
  }, [storyId, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !guestId) return;

    setMigrating(true);
    fetch("/api/storystudio/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId })
    })
      .then(() => loadResult())
      .finally(() => setMigrating(false));
  }, [guestId, isAuthenticated, loadResult]);

  function requireAuth() {
    window.localStorage.setItem(STORY_INTENDED_STORY_KEY, storyId);
    window.localStorage.setItem(STORY_AUTH_FROM_RESULT_KEY, storyId);
    if (guestId) {
      window.localStorage.setItem(STORY_GUEST_ID_KEY, guestId);
    }

    router.push(`/register?callbackUrl=${encodeURIComponent(buildStoryCabinetFromDemoUrl(storyId))}`);
  }

  const story = result?.story;
  const locked = !isAuthenticated;

  return (
    <div className="min-h-screen bg-[#07050d]">
      <StoryStudioHeader />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet" />
          </div>
        ) : error ? (
          <div className="rounded-card border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
            {error}
          </div>
        ) : story ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs text-violet">
                <Sparkles className="h-3.5 w-3.5" />
                Демо-превью вашей истории
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{story.title}</h1>
              {story.hook && <p className="mt-2 text-violet">{story.hook}</p>}
            </div>

            <ProtectedDemoText locked={locked} className="space-y-6">
              {story.synopsis && (
                <section className="rounded-card border border-white/10 bg-card/80 p-6">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold">
                    <BookOpen className="h-4 w-4 text-violet" />
                    Синопсис
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{story.synopsis}</p>
                </section>
              )}

              {story.characters.length > 0 && (
                <section className="rounded-card border border-white/10 bg-card/80 p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold">
                    <Users className="h-4 w-4 text-violet" />
                    Персонажи ({story.characters.length})
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {story.characters.map((character) => (
                      <div key={character.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="font-medium text-ink">{character.name}</div>
                        <div className="text-xs text-violet">{character.role}</div>
                        {character.appearance && (
                          <p className="mt-2 line-clamp-3 text-xs text-muted">{character.appearance}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {story.outline.length > 0 && (
                <section className="rounded-card border border-white/10 bg-card/80 p-6">
                  <h2 className="mb-3 font-semibold">План сюжета</h2>
                  <ol className="space-y-2 text-sm text-muted">
                    {story.outline.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="shrink-0 text-violet">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </ProtectedDemoText>

            {locked && (
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-[#07050d] to-transparent" />

                <div className="rounded-card border border-violet/40 bg-gradient-to-br from-violet/20 via-[#0d0a18] to-violet/10 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-violet/20 p-3">
                      <Lock className="h-6 w-6 text-violet" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">Зарегистрируйтесь, чтобы продолжить</h3>
                      <p className="mt-2 text-sm text-muted">
                        Ваш проект уже создан — после регистрации он автоматически перенесётся в личный кабинет. Там вы
                        сможете редактировать поля, генерировать главы, персонажей и видео-серии.
                      </p>
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/5 px-4 py-3 text-xs text-muted">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                        <span>
                          Регистрация нужна для защиты от спам-ботов: так мы ограничиваем бесплатные демо-генерации и
                          сохраняем качество сервиса для реальных авторов.
                        </span>
                      </div>
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          size="lg"
                          className="w-full !border-violet !bg-violet !text-white sm:w-auto"
                          onClick={requireAuth}
                        >
                          Создать аккаунт и продолжить
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Link href={`/register?callbackUrl=${encodeURIComponent(buildStoryCabinetFromDemoUrl(storyId))}`}>
                          <Button type="button" size="lg" variant="secondary" className="w-full sm:w-auto">
                            У меня уже есть аккаунт
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="text-center">
                {migrating ? (
                  <p className="text-sm text-muted">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Переносим проект в кабинет...
                  </p>
                ) : (
                  <Link href={buildStoryCabinetFromDemoUrl(storyId)}>
                    <Button className="!border-violet !bg-violet !text-white">
                      Открыть в кабинете
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <StoryStudioFooter />
    </div>
  );
}
