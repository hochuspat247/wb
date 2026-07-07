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
    <div className="overflow-hidden rounded-[20px] border border-clay bg-card p-4 shadow-soft md:p-6 lg:p-7">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <div className="min-w-0">
          <HeroStudioVisual />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:py-2">
          <div>
            <h2 className="text-xl font-black leading-tight text-ink sm:text-2xl lg:text-[1.75rem]">
              Из обычного фото — готовая карточка
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted md:text-base">
              Показываем пример результата: исходное фото, обложка 4:5 и тексты для маркетплейсов.
            </p>
          </div>

          <HeroBenefits columns={1} />

          <Button className="w-full sm:w-auto" onClick={handleTryPhoto} type="button" variant="secondary">
            Попробовать на своём фото
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
