"use client";

import { Check } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/branding";
import { describeFreeQuotaMarketing } from "@/lib/pricing";

const points = [
  "Без дизайнера и шаблонных конструкторов",
  "ИИ-обложка 4:5 и СЕО-тексты",
  "Публикация на Wildberries из кабинета",
  "Низкий порог входа и прозрачные цены"
] as const;

export function FinalCtaBanner() {
  return (
    <section className="bg-paper py-16 md:py-24" id="ready">
      <div className="section-shell">
        <Reveal variant="scale">
          <div className="final-cta-banner wow-card relative overflow-hidden rounded-[28px] px-6 py-12 md:px-12 md:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 top-6 h-40 w-40 animate-float rounded-full bg-accent/50 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 bottom-4 h-44 w-44 animate-float rounded-full bg-pink/35 blur-2xl"
              style={{ animationDelay: "-2s" }}
            />

            <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
              <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-5xl">
                Готовы попробовать {BRAND.marketCardShort}?
              </h2>

              <ul className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2 sm:gap-x-10 sm:gap-y-3">
                {points.map((point) => (
                  <li className="flex items-start gap-2.5 text-sm font-semibold text-ink" key={point}>
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-accent">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm font-medium text-muted">{describeFreeQuotaMarketing()}.</p>

              <Button
                className="mt-8"
                onClick={() => {
                  trackMarketingEvent("hero_cta_click", { source: "final_cta" });
                  focusHeroMiniGenerator({ openFilePicker: true });
                }}
                size="lg"
                type="button"
              >
                Создать карточку
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
