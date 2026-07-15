"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Layers, Package, Sparkles } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { Reveal } from "@/components/ui/Reveal";
import {
  CARD_GENERATION_PRICE_RUB,
  PLAN_CATALOG_NAME,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_SLIDE_COUNT,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  formatRub,
  formatVideoPriceRub,
  slidesBuyCta
} from "@/lib/pricing";

function slidesWord(count: number) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return "слайдов";
  if (n1 === 1) return "слайд";
  if (n1 >= 2 && n1 <= 4) return "слайда";
  return "слайдов";
}

const PRESETS = [
  {
    count: 5,
    tag: "Выгодно",
    title: PLAN_SKU_KIT_NAME,
    hint: "Обложка + 4 слайда для одного товара",
    icon: Package
  },
  {
    count: 10,
    tag: "2 SKU",
    title: "10 слайдов",
    hint: "До двух комплектов по 5",
    icon: Layers
  },
  {
    count: 20,
    tag: "Каталог",
    title: PLAN_CATALOG_NAME,
    hint: "До 4 комплектов · максимальная экономия",
    icon: Sparkles
  }
] as const;

export function PricingCalculatorSection() {
  const [count, setCount] = useState(SKU_KIT_SLIDE_COUNT);

  const price = useMemo(() => calculatePackagePrice(count), [count]);
  const progress = ((count - 1) / (500 - 1)) * 100;

  return (
    <section className="relative overflow-hidden border-t border-clay bg-paper py-20 md:py-28" id="pricing-calculator">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-pink/20 blur-3xl"
      />

      <div className="section-shell relative z-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.75rem]">
              Калькулятор слайдов
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-muted md:text-lg">
              Поштучно — {formatRub(CARD_GENERATION_PRICE_RUB)}. Комплект и каталог дешевле за слайд. Видео — отдельно,
              от {formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)] lg:gap-6">
          <Reveal className="h-full" delay={1} variant="right">
            <div className="flex h-full flex-col gap-3 md:gap-4">
              {PRESETS.map((preset) => {
                const presetPrice = calculatePackagePrice(preset.count);
                const active = count === preset.count;

                return (
                  <button
                    className={`wow-card flex min-h-0 flex-1 flex-col justify-between rounded-[24px] border p-5 text-left md:p-6 ${
                      active
                        ? "border-ink bg-accent shadow-[0_18px_50px_rgba(191,249,63,0.28)]"
                        : "border-clay bg-card hover:border-ink/15"
                    }`}
                    key={preset.count}
                    onClick={() => setCount(preset.count)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`grid h-11 w-11 place-items-center rounded-2xl ${
                          active ? "bg-ink text-accent" : "bg-accent/40 text-ink"
                        }`}
                      >
                        <preset.icon size={20} />
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                          active ? "bg-ink text-white" : "bg-accent-soft text-accent-ink"
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-display text-lg font-semibold text-ink">{preset.title}</h3>
                      <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted">{preset.hint}</p>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="font-display text-2xl font-bold text-ink">{formatRub(presetPrice.total)}</p>
                      {presetPrice.savingsPercent > 0 ? (
                        <p className="pb-1 text-xs font-bold text-accent-ink">−{presetPrice.savingsPercent}%</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal className="h-full" delay={2} variant="left">
            <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-[32px] border border-clay bg-card p-6 shadow-card md:min-h-[620px] md:p-8 lg:min-h-full lg:p-9">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Свой объём</p>
                  <p className="font-display mt-2 text-3xl font-semibold text-ink md:text-4xl">
                    {count} {slidesWord(count)}
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-ink transition hover:gap-2.5"
                  onClick={() => setCount(100)}
                  type="button"
                >
                  100 слайдов
                  <ArrowRight size={16} />
                </button>
              </div>

              <label className="mt-10 block md:mt-12">
                <span className="sr-only">Число слайдов</span>
                <div className="relative h-5">
                  <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-ink/10" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ADDF41] to-accent"
                    style={{ width: `${progress}%` }}
                  />
                  <input
                    className="pricing-range absolute inset-0 z-10 h-5 w-full cursor-pointer appearance-none bg-transparent"
                    max={500}
                    min={1}
                    onChange={(event) => setCount(Number(event.target.value))}
                    type="range"
                    value={count}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs font-semibold text-muted">
                  <span>1</span>
                  <span>500</span>
                </div>
              </label>

              <div className="mt-auto grid gap-4 rounded-[24px] bg-accent-soft p-5 sm:grid-cols-[1.2fr_0.8fr] sm:items-end sm:p-7 md:mt-12">
                <div>
                  <p className="text-sm font-semibold text-muted">
                    Итого за {count} {slidesWord(count)}
                  </p>
                  <p className="font-display mt-2 text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-6xl">
                    {formatRub(price.total)}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-muted">Цена за 1 слайд</p>
                  <p className="mt-1 text-xl font-black text-accent-ink md:text-2xl">
                    {formatRub(price.pricePerUnit)}
                  </p>
                  {price.savingsPercent > 0 ? (
                    <p className="mt-1 text-xs font-bold text-accent-ink">Скидка {price.savingsPercent}%</p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-muted">Базовая цена</p>
                  )}
                </div>
              </div>

              <PaymentButton className="mt-6 w-full md:mt-8" count={count} size="lg">
                {slidesBuyCta(count, price.total)}
              </PaymentButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
