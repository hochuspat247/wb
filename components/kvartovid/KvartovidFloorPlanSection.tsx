"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KvartovidFloorPlanEditor } from "@/components/kvartovid/KvartovidFloorPlanEditor";
import { KvartovidPaymentButton } from "@/components/kvartovid/KvartovidPaymentButton";
import { KvartovidProtectedMedia } from "@/components/kvartovid/KvartovidProtectedMedia";
import { updateKvartovidListingFloorPlan } from "@/lib/api/kvartovid";
import { FLOOR_PLAN_DISCLAIMER } from "@/lib/kvartovid/floorPlanRender";
import { downloadFloorPlanPng, downloadFloorPlanSvg } from "@/lib/kvartovid/floorPlanDownload";
import type { KvartovidFloorPlanLayout } from "@/types/kvartovid";

type KvartovidFloorPlanSectionProps = {
  svg: string;
  layout?: KvartovidFloorPlanLayout;
  error?: string;
  resetKey?: string;
  listingId?: string;
  photoPreviews?: Array<{ previewUrl: string; name?: string }>;
  bestPhotoIndex?: number;
  watermarkLocked?: boolean;
  onChange?: (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => void;
  onSaved?: (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => void;
};

export function KvartovidFloorPlanSection({
  svg,
  layout,
  error,
  resetKey,
  listingId,
  photoPreviews,
  bestPhotoIndex = 0,
  watermarkLocked = false,
  onChange,
  onSaved
}: KvartovidFloorPlanSectionProps) {
  const downloadsLocked = watermarkLocked !== false;
  const [currentSvg, setCurrentSvg] = useState(svg);
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [pngLoading, setPngLoading] = useState(false);
  const [pngError, setPngError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentSvg(svg);
    setCurrentLayout(layout);
    setSaveState("idle");
  }, [resetKey, svg, layout]);

  const persistFloorPlan = useCallback(
    async (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => {
      if (!listingId) return;

      setSaveState("saving");
      try {
        await updateKvartovidListingFloorPlan(listingId, {
          floorPlanSvg: payload.svg,
          floorPlanLayout: payload.layout
        });
        setSaveState("saved");
        onSaved?.(payload);
      } catch {
        setSaveState("error");
      }
    },
    [listingId, onSaved]
  );

  const handleChange = useCallback(
    (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => {
      setCurrentLayout(payload.layout);
      setCurrentSvg(payload.svg);
      onChange?.(payload);

      if (!listingId) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void persistFloorPlan(payload);
      }, 700);
    },
    [listingId, onChange, persistFloorPlan]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  async function handleDownloadPng() {
    setPngLoading(true);
    setPngError("");

    try {
      await downloadFloorPlanPng(currentSvg);
    } catch (err) {
      setPngError(err instanceof Error ? err.message : "Не удалось скачать PNG.");
    } finally {
      setPngLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-[#0a1210]/90 to-amber-500/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
            <LayoutGrid className="h-4 w-4 text-emerald-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Схема планировки</p>
            {currentLayout ? (
              <p className="text-xs text-muted">
                {currentLayout.rooms.length} зон · {currentLayout.totalArea} м²
                {listingId && saveState === "saving" ? " · сохраняем…" : null}
                {listingId && saveState === "saved" ? " · сохранено" : null}
                {listingId && saveState === "error" ? " · ошибка сохранения" : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {photoPreviews?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted">Сверьте планировку с вашими фото</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {photoPreviews.map((photo, index) => (
              <KvartovidProtectedMedia
                key={`${photo.previewUrl}-${index}`}
                locked={watermarkLocked === true}
                className={`relative shrink-0 overflow-hidden rounded-xl ${
                  index === bestPhotoIndex ? "ring-2 ring-amber-400" : "border border-white/10"
                }`}
              >
                <img
                  src={photo.previewUrl}
                  alt={photo.name || `Фото ${index + 1}`}
                  className="h-24 w-32 object-cover sm:h-28 sm:w-36"
                  draggable={!watermarkLocked}
                />
                <span className="absolute bottom-1.5 left-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {index + 1}
                </span>
              </KvartovidProtectedMedia>
            ))}
          </div>
        </div>
      ) : null}

      {currentLayout ? (
        <div className="mt-4">
          <KvartovidProtectedMedia locked={watermarkLocked === true}>
            <KvartovidFloorPlanEditor
              key={resetKey ?? "floor-plan"}
              layout={currentLayout}
              showExportPreview={!downloadsLocked}
              onChange={handleChange}
            />
          </KvartovidProtectedMedia>
        </div>
      ) : (
        <KvartovidProtectedMedia locked={watermarkLocked === true} className="mt-4">
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentSvg)}`}
            alt="Схема планировки квартиры"
            className="w-full rounded-xl border border-white/10 bg-white"
            draggable={!downloadsLocked}
          />
        </KvartovidProtectedMedia>
      )}

      <p className="mt-2 text-xs text-muted">{FLOOR_PLAN_DISCLAIMER}</p>
      {error ? <p className="mt-2 text-xs text-amber-200">{error}</p> : null}
      {pngError ? <p className="mt-2 text-xs text-red-300">{pngError}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {downloadsLocked ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-100">
              Скачивание схемы планировки (SVG и PNG) доступно только в платной версии.
            </p>
            <div className="flex flex-wrap gap-2">
              <KvartovidPaymentButton
                className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400"
                planId="listing"
                size="sm"
              >
                Оплатить 99 ₽
              </KvartovidPaymentButton>
              <KvartovidPaymentButton
                className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400"
                planId="cover"
                size="sm"
              >
                Оплатить 149 ₽
              </KvartovidPaymentButton>
            </div>
          </div>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => downloadFloorPlanSvg(currentSvg)}>
              <Download className="h-4 w-4" />
              Скачать SVG
            </Button>
            <Button type="button" variant="secondary" disabled={pngLoading} onClick={handleDownloadPng}>
              {pngLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Скачать PNG
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
