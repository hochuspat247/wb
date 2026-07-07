"use client";

import { ArrowRight } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import { Button } from "@/components/ui/Button";

export function HeroActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button
        className="w-full sm:w-auto"
        data-analytics="hero_cta_click"
        onClick={() => {
          trackMarketingEvent("hero_cta_click");
          focusHeroMiniGenerator({ openFilePicker: true });
        }}
        size="lg"
        type="button"
      >
        Загрузить фото и создать демо
        <ArrowRight size={18} />
      </Button>
      <Button
        className="w-full sm:w-auto"
        data-analytics="examples_click"
        onClick={() => {
          trackMarketingEvent("examples_click");
          const target = document.getElementById("examples");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", "#examples");
        }}
        size="lg"
        type="button"
        variant="secondary"
      >
        Посмотреть примеры
      </Button>
    </div>
  );
}
