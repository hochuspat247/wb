"use client";

import { ArrowRight } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/branding";
import { FREE_DEMO_CARDS, FREE_TRIAL_CARDS, GENERATION_TIME_COPY } from "@/lib/pricing";

const stats = [
  {
    value: "1–2 мин",
    label: "обычно на генерацию карточки"
  },
  {
    value: `${FREE_DEMO_CARDS + FREE_TRIAL_CARDS}`,
    label: "пробные карточки на старте"
  },
  {
    value: "3",
    label: "площадки: ВБ, Озон и Авито"
  }
] as const;

export function StatsStrip() {
  return (
    <section className="wow-section-glow border-y border-clay bg-card py-16 md:py-24" id="stats">
      <div className="section-shell">
        <Reveal>
          <h2 className="font-display mx-auto max-w-3xl text-center text-3xl font-semibold leading-tight text-ink md:text-4xl">
            {BRAND.marketCardShort} в цифрах
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-0">
          {stats.map((item, index) => (
            <Reveal delay={(index + 1) as 1 | 2 | 3} key={item.label} variant="scale">
              <div
                className={`px-4 text-center sm:min-h-[164px] sm:px-8 sm:py-6 ${
                  index < stats.length - 1 ? "sm:border-r sm:border-ink/15" : ""
                }`}
              >
                <p className="wow-stat-num text-4xl font-semibold md:text-5xl lg:text-[52px]">{item.value}</p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted md:text-base">{item.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-medium text-muted">
            {GENERATION_TIME_COPY}. Без подписки на старте — сначала смотрите результат.
          </p>
        </Reveal>

        <Reveal className="mt-8 flex justify-center" delay={3}>
          <Button
            onClick={() => {
              trackMarketingEvent("hero_cta_click", { source: "stats" });
              focusHeroMiniGenerator({ openFilePicker: true });
            }}
            size="lg"
            type="button"
          >
            Попробовать бесплатно
            <ArrowRight size={18} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
