"use client";

import { useMemo, useState } from "react";
import { PaymentButton } from "@/components/PaymentButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  CARD_GENERATION_PRICE_RUB,
  GENERATION_PACKAGES,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  formatRub,
  formatVideoPriceRub
} from "@/lib/pricing";

const presetCounts = GENERATION_PACKAGES.map((pack) => pack.count);

export function PricingCalculatorSection() {
  const [count, setCount] = useState(10);

  const price = useMemo(() => calculatePackagePrice(count), [count]);

  return (
    <section className="border-t border-clay bg-card py-20 md:py-28" id="pricing-calculator">
      <div className="section-shell">
        <SectionHeader
          description={`Базовая цена — ${formatRub(CARD_GENERATION_PRICE_RUB)} за 1 фото. Видео из готовой карточки оплачивается отдельно, от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}.`}
          title="Калькулятор пакета генераций"
        />

        <Reveal delay={1}>
          <div className="mx-auto mt-10 max-w-2xl rounded-[24px] border border-clay bg-paper/40 p-4 sm:mt-12 sm:rounded-[28px] sm:p-6 md:p-8">
            <div className="grid grid-cols-3 gap-2">
              {presetCounts.map((preset) => (
                <button
                  className={`rounded-full border px-3 py-2.5 text-sm font-bold transition sm:px-4 ${
                    count === preset
                      ? "border-accent bg-accent text-paper"
                      : "border-clay text-muted hover:border-accent/30 hover:text-ink"
                  }`}
                  key={preset}
                  onClick={() => setCount(preset)}
                  type="button"
                >
                  {preset} фото
                </button>
              ))}
            </div>

            <label className="mt-5 grid gap-3 sm:mt-6">
              <span className="text-sm font-semibold text-muted">Или укажите своё количество: {count}</span>
              <input
                className="h-2 w-full cursor-pointer accent-accent"
                max={500}
                min={1}
                onChange={(event) => setCount(Number(event.target.value))}
                type="range"
                value={count}
              />
              <div className="flex justify-between text-xs font-semibold text-muted/80">
                <span>1</span>
                <span>500</span>
              </div>
            </label>

            <div className="mt-6 rounded-[20px] border border-clay bg-card p-4 sm:mt-8 sm:rounded-[22px] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div>
                  <p className="text-sm font-semibold text-muted">Итого за {count} генераций</p>
                  <p className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">{formatRub(price.total)}</p>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-clay pt-4 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                  <p className="text-sm font-semibold text-muted">Цена за 1 фото</p>
                  <div className="text-right">
                    <p className="text-lg font-black text-accent sm:mt-2 sm:text-xl">{formatRub(price.pricePerUnit)}</p>
                    {price.savingsPercent > 0 ? (
                      <p className="mt-1 text-xs font-bold text-mint">Скидка {price.savingsPercent}%</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <PaymentButton className="mt-5 sm:mt-6" count={count} size="lg">
              Купить пакет
            </PaymentButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
