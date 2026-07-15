"use client";

import { ArrowRight, ImageIcon, Layers, ListChecks, Sparkles, Target } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import {
  KIT_SERIES_DESCRIPTION,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_SLIDE_COUNT,
  calculatePackagePrice,
  describeFreeQuotaMarketing,
  formatRub,
  kitBuyCta
} from "@/lib/pricing";

const kit = calculatePackagePrice(SKU_KIT_SLIDE_COUNT);

const kitItems = [
  {
    icon: ImageIcon,
    title: "Титульная обложка 4:5",
    text: "Главный слайд для листинга на WB, Ozon и Авито.",
    tone: "green" as const,
    featured: true
  },
  {
    icon: Sparkles,
    title: "Преимущества",
    text: "Ключевые выгоды товара без выдуманных свойств.",
    tone: "pink" as const,
    featured: false
  },
  {
    icon: ListChecks,
    title: "Характеристики",
    text: "Структурированные параметры для карточки.",
    tone: "cream" as const,
    featured: false
  },
  {
    icon: Target,
    title: "Сценарий использования",
    text: "Как товар работает в реальной ситуации.",
    tone: "cream" as const,
    featured: false
  },
  {
    icon: Layers,
    title: "Рекламный вариант",
    text: "Дополнительный слайд для тестов и продвижения.",
    tone: "pink" as const,
    featured: false
  }
] as const;

const toneClass = {
  green: "wow-promo-green",
  pink: "wow-promo-pink",
  cream: "wow-promo-cream"
};

export function SkuKitSection() {
  const featured = kitItems[0];
  const rest = kitItems.slice(1);

  function scrollToPricing() {
    trackMarketingEvent("pricing_click", { source: "sku_kit" });
    document.getElementById("pricing-calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#pricing-calculator");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <section className="wow-section-glow border-t border-clay bg-paper py-20 md:py-28" id="sku-kit">
      <div className="section-shell">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-12">
          <Reveal variant="right">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">Комплект · 5 слайдов</p>
              <h2 className="font-display mt-3 max-w-[16ch] text-3xl font-semibold leading-[1.08] text-ink md:text-4xl lg:text-[2.75rem]">
                Что входит в «{PLAN_SKU_KIT_NAME}»
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-muted md:text-lg">
                {describeFreeQuotaMarketing()}. Чтобы собрать серию без метки — комплект:{" "}
                {KIT_SERIES_DESCRIPTION.toLowerCase()}.
              </p>
            </div>
          </Reveal>

          <Reveal delay={1} variant="left">
            <div className="wow-card wow-promo-green relative overflow-hidden rounded-[28px] border border-clay/70 p-6 md:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 animate-float rounded-full bg-accent/55 blur-2xl"
              />
              <p className="relative z-10 text-xs font-bold uppercase tracking-[0.16em] text-muted">Цена комплекта</p>
              <p className="relative z-10 font-display mt-2 text-4xl font-bold text-ink md:text-5xl">
                {formatRub(kit.total)}
              </p>
              <p className="relative z-10 mt-2 text-sm font-medium text-muted">
                Разовая оплата · без подписки · СЕО и скачивание без метки
              </p>
              <Button className="relative z-10 mt-5 w-full" onClick={scrollToPricing} size="lg" type="button">
                {kitBuyCta()}
                <ArrowRight size={18} />
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-2">
          <Reveal delay={1} variant="scale">
            <article
              className={`wow-card relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] border border-clay/70 p-7 md:min-h-[280px] md:p-8 ${toneClass[featured.tone]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-ink text-accent">
                  <featured.icon size={26} />
                </div>
                <span className="font-display text-5xl font-bold text-ink/10 md:text-6xl">01</span>
              </div>
              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Слайд 1 · главный</p>
                <h3 className="font-display mt-2 text-2xl font-semibold text-ink md:text-3xl">{featured.title}</h3>
                <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-muted md:text-base">
                  {featured.text}
                </p>
              </div>
            </article>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((item, index) => {
              const num = String(index + 2).padStart(2, "0");
              return (
                <Reveal delay={Math.min(index + 2, 4) as 1 | 2 | 3 | 4} key={item.title} variant="scale">
                  <article
                    className={`wow-card flex h-full min-h-[180px] flex-col rounded-[24px] border border-clay/70 p-5 md:p-6 ${toneClass[item.tone]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-accent">
                        <item.icon size={20} />
                      </div>
                      <span className="font-display text-3xl font-bold text-ink/10">{num}</span>
                    </div>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Слайд {index + 2}</p>
                    <h3 className="font-display mt-1.5 text-lg font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-muted">{item.text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal className="mt-8 flex flex-col items-start gap-4 sm:mt-10 sm:flex-row sm:items-center sm:justify-between" delay={2}>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-base">
            Все 5 слайдов связаны в одну серию для SKU. Сначала можно проверить результат на демо.
          </p>
          <Button
            onClick={() => {
              trackMarketingEvent("hero_cta_click", { source: "sku_kit_demo" });
              focusHeroMiniGenerator({ openFilePicker: true });
            }}
            type="button"
            variant="secondary"
          >
            Попробовать на своём товаре
            <ArrowRight size={16} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
