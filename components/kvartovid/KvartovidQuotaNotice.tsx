"use client";

import Link from "next/link";

type Props = {
  quota: {
    canGenerate?: boolean;
    remaining?: number;
    listingsCount?: number;
    freeListingsRemaining?: number;
  } | null;
  variant?: "banner" | "blocked";
};

export function KvartovidQuotaNotice({ quota, variant = "banner" }: Props) {
  if (!quota) {
    return null;
  }

  if (quota.canGenerate && (quota.freeListingsRemaining ?? 0) > 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        У вас доступно {quota.freeListingsRemaining} бесплатное объявление КвартоВид — оно не связано с квотой
        MarketCard.
      </div>
    );
  }

  if (quota.canGenerate) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Можно создать объявление. Осталось попыток: {quota.remaining ?? 0}.
      </div>
    );
  }

  if (variant === "banner") {
    return null;
  }

  return (
    <div className="space-y-4 text-left">
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4">
        <p className="font-semibold text-red-100">
          {quota.listingsCount ? "Бесплатное объявление уже использовано" : "Сейчас нельзя создать объявление"}
        </p>
        <p className="mt-2 text-sm text-red-100/80">
          {quota.listingsCount
            ? "Оплатите следующее объявление в блоке ниже, затем нажмите «Сгенерировать»."
            : "Оплатите объявление в блоке ниже или проверьте, что вы вошли в тот же аккаунт."}
        </p>
      </div>
      <Link href="/kvartovid/cabinet" className="inline-block text-sm text-amber-300 hover:text-amber-200">
        Открыть «Мои объявления»
      </Link>
    </div>
  );
}
