"use client";

import Link from "next/link";
import { KvartovidPaymentButton } from "@/components/kvartovid/KvartovidPaymentButton";

type Props = {
  compact?: boolean;
};

export function KvartovidDemoBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Пробная версия: на фото и обложке водяной знак <span className="font-bold">DEMO</span>. Тексты можно
        копировать. Чистые фото и обложка — после оплаты.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <p className="font-semibold text-amber-100">Пробная версия с водяным знаком DEMO</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-100/85">
        Тексты объявления можно копировать и скачивать бесплатно. Фото и обложка показываются с водяным знаком —
        скачивание оригиналов доступно после оплаты тарифа.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <KvartovidPaymentButton className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400" planId="listing">
          Оплатить 99 ₽
        </KvartovidPaymentButton>
        <Link href="/kvartovid#pricing" className="inline-flex items-center text-sm text-amber-300 hover:text-amber-200">
          Все тарифы
        </Link>
      </div>
    </div>
  );
}
