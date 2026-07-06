"use client";

import { useMemo, useState } from "react";
import { PaymentButton } from "@/components/PaymentButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  GENERATION_PACKAGES,
  calculatePackagePrice,
  formatRub
} from "@/lib/pricing";

const presetCounts = GENERATION_PACKAGES.map((pack) => pack.count);

export function PricingCalculatorSection() {
  const [count, setCount] = useState(10);

  const price = useMemo(() => calculatePackagePrice(count), [count]);

  return (
    <section className="border-t border-clay bg-card py-20 md:py-28" id="pricing-calculator">
      <div className="section-shell">
        <SectionHeader
          description="Выберите объём — система автоматически посчитает стоимость пакета с учётом скидки за объём."
          title="Калькулятор пакета генераций"
        />

        <Reveal delay={1}>
          <div className="mx-auto mt-12 max-w-2xl rounded-[28px] border border-clay bg-paper/40 p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              {presetCounts.map((preset) => (
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
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

            <label className="mt-6 grid gap-3">
              <span className="text-sm font-semibold text-muted">Или укажите своё количество: {count}</span>
              <input
                className="w-full accent-accent"
                max={500}
                min={1}
                onChange={(event) => setCount(Number(event.target.value))}
                type="range"
                value={count}
              />
            </label>

            <div className="mt-8 rounded-[22px] border border-clay bg-card p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted">Итого за {count} генераций</p>
                  <p className="mt-2 text-4xl font-black text-ink">{formatRub(price.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-muted">Цена за 1 фото</p>
                  <p className="mt-2 text-xl font-black text-accent">{formatRub(price.pricePerUnit)}</p>
                  {price.savingsPercent > 0 ? (
                    <p className="mt-1 text-xs font-bold text-mint">Скидка {price.savingsPercent}%</p>
                  ) : null}
                </div>
              </div>
            </div>

            <PaymentButton className="mt-6" count={count} size="lg">
              Купить пакет
            </PaymentButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
