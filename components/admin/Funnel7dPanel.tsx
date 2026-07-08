"use client";

import { Filter } from "lucide-react";
import { CollapsibleAdminSection } from "@/components/admin/CollapsibleAdminSection";
import type { Funnel7dStep } from "@/lib/server/funnel7d";

type Funnel7dPanelProps = {
  steps: Funnel7dStep[];
};

function formatPercent(value: number | null) {
  if (value === null) return null;
  return `${value}%`;
}

export function Funnel7dPanel({ steps }: Funnel7dPanelProps) {
  if (!steps.length) {
    return null;
  }

  return (
    <CollapsibleAdminSection
      badge={
        <span className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-black text-mint">
          {steps[0]?.count ?? 0}
        </span>
      }
      description="Уникальные сессии за 7 дней. Проценты — переход к следующему шагу."
      icon={<Filter className="text-mint" size={20} />}
      id="funnel-7d"
      title="Воронка за 7 дней"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-1">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-[16px] border border-clay bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink">{step.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    от старта: {formatPercent(step.fromStartPercent)}
                  </p>
                </div>
                <p className="text-2xl font-black tabular-nums text-ink">{step.count}</p>
              </div>
              {index < steps.length - 1 ? (
                <div className="flex items-center gap-2 py-2 pl-4 text-xs font-bold text-muted">
                  <span className="text-base leading-none text-accent">↓</span>
                  <span>
                    {step.count > 0
                      ? `${formatPercent(steps[index + 1].fromPreviousPercent)} к «${steps[index + 1].label}»`
                      : "0% к следующему шагу"}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-[20px] border border-clay bg-paper/50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Пример чтения</p>
          <div className="mt-3 space-y-2 text-sm font-semibold leading-relaxed text-ink">
            {steps.slice(0, 6).map((step) => (
              <p key={step.id}>
                {step.count} — {step.label.toLowerCase()}
              </p>
            ))}
            {steps.length > 6 ? (
              <>
                <p className="text-muted">…</p>
                <p>
                  {steps[steps.length - 1]?.count ?? 0} — {steps[steps.length - 1]?.label.toLowerCase()}
                </p>
              </>
            ) : null}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Если на шаге резко падает процент, смотрите именно предыдущий экран: чаще всего там теряется
            мотивация или не хватает понятного следующего действия.
          </p>
        </div>
      </div>
    </CollapsibleAdminSection>
  );
}
