"use client";

import type { ReactNode } from "react";
import { Store } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { Card } from "@/components/ui/Card";
import { WB_INTEGRATION_MIN_PACKAGE, calculatePackagePrice, formatRub } from "@/lib/pricing";

type WildberriesSubscriptionOverlayProps = {
  unlocked: boolean;
  children: ReactNode;
  className?: string;
};

export function WildberriesSubscriptionOverlay({
  unlocked,
  children,
  className = ""
}: WildberriesSubscriptionOverlayProps) {
  const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <div aria-hidden className="pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-paper/72 p-4 backdrop-blur-[3px] sm:items-center sm:p-6">
        <Card
          className="w-full max-w-lg border border-[#CB11AB]/30 shadow-[0_24px_60px_rgba(203,17,171,0.18)]"
          padding="lg"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/12 text-[#CB11AB]">
              <Store size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Wildberries</p>
              <h2 className="mt-1 text-xl font-black text-ink">Карточки на Wildberries</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
                Просмотр, редактирование и публикация карточек на WB доступны с тарифа «Рост» — от{" "}
                {WB_INTEGRATION_MIN_PACKAGE} генераций ({formatRub(starterPack.total)}).
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">
                Оформите подписку, чтобы активировать кнопки и работать с вашим кабинетом WB.
              </p>
              <PaymentButton
                className="mt-4 w-full sm:w-auto"
                count={WB_INTEGRATION_MIN_PACKAGE}
                metrikaPlan="wb_cabinet_overlay_pack5"
                size="sm"
              >
                Продолжить оплату
              </PaymentButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
