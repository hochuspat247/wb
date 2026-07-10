"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FLOOR_PLAN_DISCLAIMER } from "@/lib/kvartovid/floorPlanRender";
import { downloadFloorPlanPng, downloadFloorPlanSvg } from "@/lib/kvartovid/floorPlanDownload";
import type { KvartovidFloorPlanLayout } from "@/types/kvartovid";

type KvartovidFloorPlanSectionProps = {
  svg: string;
  layout?: KvartovidFloorPlanLayout;
  error?: string;
};

export function KvartovidFloorPlanSection({ svg, layout, error }: KvartovidFloorPlanSectionProps) {
  const [pngLoading, setPngLoading] = useState(false);
  const [pngError, setPngError] = useState("");

  async function handleDownloadPng() {
    setPngLoading(true);
    setPngError("");

    try {
      await downloadFloorPlanPng(svg);
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
        {layout ? (
          <span className="text-xs text-muted">
            {layout.rooms.length} зон · {layout.totalArea} м²
          </span>
        ) : null}
      </div>

      <img
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
        alt="Схема планировки квартиры"
        className="mt-3 w-full rounded-xl border border-white/10 bg-white"
      />

      <p className="mt-2 text-xs text-muted">{FLOOR_PLAN_DISCLAIMER}</p>
      {error ? <p className="mt-2 text-xs text-amber-200">{error}</p> : null}
      {pngError ? <p className="mt-2 text-xs text-red-300">{pngError}</p> : null}

      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => downloadFloorPlanSvg(svg)}>
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
