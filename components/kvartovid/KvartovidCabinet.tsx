"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Copy, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { KvartovidPlatformTextsSection } from "@/components/kvartovid/KvartovidPlatformTextsSection";
import { KvartovidFloorPlanSection } from "@/components/kvartovid/KvartovidFloorPlanSection";
import { KvartovidHeader } from "@/components/kvartovid/KvartovidHeader";
import { KvartovidFooter } from "@/components/kvartovid/KvartovidFooter";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { deleteKvartovidListing, fetchKvartovidListings } from "@/lib/api/kvartovid";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import { formatPlatformTextsForExport } from "@/lib/kvartovid/platformTexts";
import type { KvartovidSavedListing } from "@/types/kvartovid";

function formatListingDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function listingSubtitle(listing: KvartovidSavedListing) {
  const property = PROPERTY_TYPE_LABELS[listing.propertyType].toLowerCase();
  const location = listing.metro || listing.district || listing.city;
  return `${listing.rooms}-комн. ${property}, ${listing.area} м² · ${location}`;
}

function buildExportText(listing: KvartovidSavedListing) {
  const lines = [
    "=== Универсальная версия ===",
    listing.title,
    "",
    listing.description,
    "",
    "Преимущества:",
    ...listing.advantages.map((item) => `• ${item}`),
    "",
    formatPlatformTextsForExport(listing.platformTexts)
  ];

  return lines.join("\n");
}

function coverSrc(listing: KvartovidSavedListing) {
  if (listing.coverImageBase64) {
    return `data:${listing.coverImageMimeType || "image/png"};base64,${listing.coverImageBase64}`;
  }

  return listing.coverImageUrl ?? null;
}

export function KvartovidCabinet() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<KvartovidSavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeId = searchParams.get("listing");
  const activeListing = useMemo(
    () => listings.find((listing) => listing.id === activeId) ?? null,
    [listings, activeId]
  );

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchKvartovidListings();
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить объявления.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadListings();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadListings]);

  function openListing(id: string) {
    router.push(`/kvartovid/cabinet?listing=${id}`);
  }

  function closeListing() {
    router.push("/kvartovid/cabinet");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Удалить объявление из кабинета?")) return;

    setDeletingId(id);
    setError("");

    try {
      await deleteKvartovidListing(id);
      setListings((prev) => prev.filter((listing) => listing.id !== id));

      if (activeId === id) {
        closeListing();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить объявление.");
    } finally {
      setDeletingId(null);
    }
  }

  async function copyText(listing: KvartovidSavedListing) {
    await navigator.clipboard.writeText(buildExportText(listing));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadText(listing: KvartovidSavedListing) {
    const blob = new Blob([buildExportText(listing)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kvartovid-obyavlenie.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadCover(listing: KvartovidSavedListing) {
    const src = coverSrc(listing);
    if (!src) return;

    if (listing.coverImageBase64) {
      const link = document.createElement("a");
      link.href = src;
      link.download = "kvartovid-cover.png";
      link.click();
      return;
    }

    window.open(src, "_blank", "noopener,noreferrer");
  }

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060d0b]">
        <Loader />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#060d0b] text-ink">
        <KvartovidHeader />
        <main className="mx-auto max-w-content px-4 pb-20 pt-24 sm:px-6">
          <h1 className="text-3xl font-bold">Мои объявления</h1>
          <p className="mt-2 text-muted">Войдите, чтобы видеть историю сгенерированных объявлений.</p>
          <Link href="/login?callbackUrl=/kvartovid/cabinet" className="mt-6 inline-block">
            <Button className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">Войти</Button>
          </Link>
        </main>
        <KvartovidFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d0b] text-ink">
      <KvartovidHeader />
      <main className="mx-auto max-w-content px-4 pb-20 pt-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Мои объявления</h1>
            <p className="mt-2 max-w-xl text-muted">
              История упакованных объектов — тексты, обложки и экспорт. Новые объявления сохраняются автоматически после
              генерации.
            </p>
          </div>
          <Link href="/kvartovid/create">
            <Button className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
              <Plus className="h-4 w-4" />
              Создать объявление
            </Button>
          </Link>
        </div>

        {error ? <p className="mt-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        {activeListing ? (
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={closeListing}
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-amber-400"
            >
              <ArrowLeft className="h-4 w-4" />
              К списку объявлений
            </button>

            <div className="space-y-6 rounded-card border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-400">
                    {DEAL_TYPE_LABELS[activeListing.dealType]} · {formatListingDate(activeListing.updatedAt)}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-ink">{activeListing.title}</h2>
                  <p className="mt-1 text-sm text-muted">{listingSubtitle(activeListing)}</p>
                </div>
                {typeof activeListing.qualityScore === "number" ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
                    Готовность: {activeListing.qualityScore}/100
                  </span>
                ) : null}
              </div>

              {coverSrc(activeListing) ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">AI-обложка</p>
                  <img
                    src={coverSrc(activeListing)!}
                    alt="Обложка объявления"
                    className="mt-3 max-h-80 w-full rounded-xl border border-white/10 object-cover"
                  />
                </div>
              ) : activeListing.coverImageError ? (
                <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{activeListing.coverImageError}</p>
              ) : null}

              {activeListing.floorPlanSvg ? (
                <KvartovidFloorPlanSection
                  svg={activeListing.floorPlanSvg}
                  layout={activeListing.floorPlanLayout}
                  error={activeListing.floorPlanError}
                />
              ) : null}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Универсальное описание</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{activeListing.description}</p>
              </div>

              <KvartovidPlatformTextsSection platformTexts={activeListing.platformTexts} />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Преимущества</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {activeListing.advantages.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              {activeListing.qualityTips?.length ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Советы до публикации</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {activeListing.qualityTips.map((tip) => (
                      <li key={tip}>+ {tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => copyText(activeListing)}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Скопировано" : "Копировать текст"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => downloadText(activeListing)}>
                  <Download className="h-4 w-4" />
                  Скачать текст
                </Button>
                {coverSrc(activeListing) ? (
                  <Button type="button" variant="secondary" onClick={() => downloadCover(activeListing)}>
                    <Download className="h-4 w-4" />
                    Скачать обложку
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={deletingId === activeListing.id}
                  onClick={() => handleDelete(activeListing.id)}
                  className="!border-red-500/30 !text-red-300 hover:!bg-red-500/10"
                >
                  {deletingId === activeListing.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Удалить
                </Button>
              </div>
            </div>
          </div>
        ) : listings.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const preview = coverSrc(listing);

              return (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => openListing(listing.id)}
                  className="group overflow-hidden rounded-card border border-white/10 bg-card/50 text-left transition hover:border-amber-500/40 hover:bg-card/80"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#0a1210]">
                    {preview ? (
                      <img src={preview} alt={listing.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
                        Без обложки
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-semibold text-ink">{listing.title}</p>
                    <p className="mt-1 text-sm text-muted">{listingSubtitle(listing)}</p>
                    <p className="mt-2 text-xs text-muted">{formatListingDate(listing.updatedAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-card border border-white/10 bg-card/50 p-8 text-center">
            <p className="text-muted">Пока нет сохранённых объявлений в кабинете.</p>
            <Link href="/kvartovid/create" className="mt-6 inline-block">
              <Button className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
                Создать объявление
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </main>
      <KvartovidFooter />
    </div>
  );
}
