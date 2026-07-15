"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { KIT_SERIES_DESCRIPTION, PLAN_SKU_KIT_NAME } from "@/lib/pricing";

const steps = [
  {
    num: "01",
    title: "Загрузите фото товара",
    text: "Один кадр и короткое описание — этого достаточно, чтобы стартовать демо.",
    cta: "Загрузить фото",
    action: "generator" as const,
    tone: "green" as const
  },
  {
    num: "02",
    title: "Получите обложку за 1–2 минуты",
    text: "ИИ соберёт карточку 4:5, описание и СЕО-ключи под выбранный маркетплейс.",
    cta: "Смотреть примеры",
    action: "examples" as const,
    tone: "pink" as const
  },
  {
    num: "03",
    title: "Купите комплект и скачайте без метки",
    text: `${KIT_SERIES_DESCRIPTION} — в тарифе «${PLAN_SKU_KIT_NAME}».`,
    cta: "К тарифам",
    action: "pricing" as const,
    tone: "cream" as const
  }
] as const;

const toneClass = {
  green: "wow-promo-green",
  pink: "wow-promo-pink",
  cream: "wow-promo-cream"
};

export function HowItWorksSteps() {
  function handleStepAction(action: (typeof steps)[number]["action"]) {
    if (action === "generator") {
      trackMarketingEvent("hero_cta_click", { source: "how_it_works" });
      focusHeroMiniGenerator({ openFilePicker: true });
      return;
    }

    const id = action === "examples" ? "examples" : "pricing";
    const goal = action === "examples" ? "examples_click" : "pricing_click";
    trackMarketingEvent(goal, { source: "how_it_works" });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <section className="wow-section-glow border-y border-clay bg-paper-alt py-20 md:py-28" id="how-it-works">
      <div className="section-shell">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Что даёт платформа?
            </h2>
            <p className="mt-4 text-base font-medium text-muted md:text-lg">
              Три шага от фото до готовой серии инфографики для одного товара.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal delay={(index + 1) as 1 | 2 | 3} key={step.num} variant="scale">
              <article
                className={`wow-card relative flex h-full flex-col overflow-hidden rounded-[28px] border border-clay/70 p-7 ${toneClass[step.tone]}`}
              >
                <span className="font-display text-5xl font-bold text-ink/15 md:text-6xl">{step.num}</span>
                <span className="mt-2 inline-block h-2 w-12 rounded-full bg-ink" />
                <h3 className="font-display mt-6 text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-muted">{step.text}</p>
                <button
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink transition-all duration-300 hover:gap-3"
                  onClick={() => handleStepAction(step.action)}
                  type="button"
                >
                  {step.cta}
                  <ArrowRight size={16} />
                </button>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex justify-center" delay={2}>
          <Link href="/register">
            <Button
              onClick={() => trackMarketingEvent("click_create_card", { source: "how_it_works" })}
              size="lg"
              type="button"
            >
              Запустить за 1–2 минуты
              <ArrowRight size={18} />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
