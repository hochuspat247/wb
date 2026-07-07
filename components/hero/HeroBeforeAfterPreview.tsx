"use client";

import { ArrowRight } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { HeroBenefits } from "@/components/hero/HeroBenefits";
import { HeroStudioVisual } from "@/components/hero/HeroStudioVisual";
import { Button } from "@/components/ui/Button";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";

export function HeroBeforeAfterPreview() {
  function handleTryPhoto() {
    trackMarketingEvent("hero_cta_click", { source: "result_preview" });
    focusHeroMiniGenerator({ openFilePicker: true });
  }

  return (
    <div className="rounded-[20px] border border-clay bg-card p-4 shadow-soft md:p-6 lg:p-7">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-10 xl:gap-12">
        <HeroStudioVisual className="lg:max-w-[520px]" />

        <div className="flex flex-col gap-5 lg:py-2">
          <div>
            <h2 className="text-xl font-black leading-tight text-ink sm:text-2xl lg:text-[1.75rem]">
              Из обычного фото — готовая карточка
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted md:text-base">
              Показываем пример результата: исходное фото, обложка 4:5 и тексты для маркетплейсов.
            </p>
          </div>

          <HeroBenefits className="sm:grid-cols-1" />

          <Button className="w-full sm:w-auto" onClick={handleTryPhoto} type="button" variant="secondary">
            Попробовать на своём фото
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
