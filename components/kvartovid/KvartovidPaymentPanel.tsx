"use client";

import { KvartovidPaymentButton } from "@/components/kvartovid/KvartovidPaymentButton";
import { KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";
import type { KvartovidPaidPlanId } from "@/lib/kvartovid/pricing";

export type KvartovidQuotaSummary = {
  canGenerate?: boolean;
  remaining?: number;
  listingsCount?: number;
  freeListingsRemaining?: number;
};

type PaidPlan = {
  id: KvartovidPaidPlanId;
  label: string;
  priceLabel: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
};

const PAID_PLANS: PaidPlan[] = [
  {
    id: "listing",
    label: "1 объект",
    priceLabel: `${KVARTOVID_PRICES.listing} ₽`,
    description: "Тексты для Авито, Циан и Домклик без водяного знака"
  },
  {
    id: "cover",
    label: "Объект + обложка",
    priceLabel: `${KVARTOVID_PRICES.listingWithCover} ₽`,
    description: "Тексты и AI-обложка для площадок",
    badge: "Популярный",
    highlighted: true
  }
];

type Props = {
  quota?: KvartovidQuotaSummary | null;
  compact?: boolean;
  title?: string;
};

function QuotaLine({ quota }: { quota: KvartovidQuotaSummary }) {
  if ((quota.freeListingsRemaining ?? 0) > 0) {
    return (
      <p className="text-sm text-emerald-200">
        Бесплатно осталось: {quota.freeListingsRemaining} объявление. Оплата ниже — для следующих.
      </p>
    );
  }

  if (quota.canGenerate) {
    return <p className="text-sm text-amber-200">Доступно генераций: {quota.remaining ?? 0}. Можно докупить ещё.</p>;
  }

  return (
    <p className="text-sm text-red-200">
      Сейчас генерация недоступна — оплатите объявление, затем создайте его на странице «Создать».
    </p>
  );
}

export function KvartovidPaymentPanel({ quota, compact = false, title = "Купить объявление" }: Props) {
  if (compact) {
    return (
      <div className="rounded-card border border-white/10 bg-card/50 p-4">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {quota ? <div className="mt-2"><QuotaLine quota={quota} /></div> : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PAID_PLANS.map((plan) => (
            <KvartovidPaymentButton
              key={plan.id}
              className="w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400"
              planId={plan.id}
              size="sm"
            >
              {plan.label} — {plan.priceLabel}
            </KvartovidPaymentButton>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-white/10 bg-card/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">Оплата через ЮKassa. После оплаты можно сразу создавать объявление.</p>
        </div>
      </div>

      {quota ? <div className="mt-4"><QuotaLine quota={quota} /></div> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {PAID_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-4 ${
              plan.highlighted ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-[#0a1210]/60"
            }`}
          >
            {plan.badge ? (
              <span className="inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-black">
                {plan.badge}
              </span>
            ) : null}
            <p className="mt-2 font-semibold text-ink">{plan.label}</p>
            <p className="mt-1 text-2xl font-black text-amber-400">{plan.priceLabel}</p>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>
            <div className="mt-4">
              <KvartovidPaymentButton
                className="w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400"
                planId={plan.id}
              >
                Оплатить {plan.priceLabel}
              </KvartovidPaymentButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
