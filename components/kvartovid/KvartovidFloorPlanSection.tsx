"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KvartovidFloorPlanEditor } from "@/components/kvartovid/KvartovidFloorPlanEditor";
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
  onChange?: (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => void;
  onSaved?: (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => void;
};

export function KvartovidFloorPlanSection({
  svg,
  layout,
  error,
  resetKey,
  listingId,
  onChange,
  onSaved
}: KvartovidFloorPlanSectionProps) {
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Схема планировки</p>
        {currentLayout ? (
          <span className="text-xs text-muted">
            {currentLayout.rooms.length} зон · {currentLayout.totalArea} м²
            {listingId && saveState === "saving" ? " · сохраняем…" : null}
            {listingId && saveState === "saved" ? " · сохранено" : null}
            {listingId && saveState === "error" ? " · ошибка сохранения" : null}
          </span>
        ) : null}
      </div>

      {currentLayout ? (
        <div className="mt-3">
          <KvartovidFloorPlanEditor key={resetKey ?? "floor-plan"} layout={currentLayout} onChange={handleChange} />
        </div>
      ) : (
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentSvg)}`}
          alt="Схема планировки квартиры"
          className="mt-3 w-full rounded-xl border border-white/10 bg-white"
        />
      )}

      <p className="mt-2 text-xs text-muted">{FLOOR_PLAN_DISCLAIMER}</p>
      {error ? <p className="mt-2 text-xs text-amber-200">{error}</p> : null}
      {pngError ? <p className="mt-2 text-xs text-red-300">{pngError}</p> : null}

      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => downloadFloorPlanSvg(currentSvg)}>
          <Download className="h-4 w-4" />
          Скачать SVG
        </Button>
        <Button type="button" variant="secondary" disabled={pngLoading} onClick={handleDownloadPng}>
          {pngLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Скачать PNG
        </Button>
      </div>
    </div>
  );
}
