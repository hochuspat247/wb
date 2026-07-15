"use client";

import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/Button";
import {
  KIT_SERIES_DESCRIPTION,
  KIT_UNLOCK_CTA,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_PRICE_RUB,
  SKU_KIT_SLIDE_COUNT,
  formatRub
} from "@/lib/pricing";

type KitOfferBannerProps = {
  darkConsole?: boolean;
  onBuyClick?: () => void;
  showPaymentButton?: boolean;
  title?: string;
  description?: string;
};

export function KitOfferBanner({
  darkConsole = false,
  onBuyClick,
  showPaymentButton = true,
  title = PLAN_SKU_KIT_NAME,
  description = `${KIT_SERIES_DESCRIPTION}. Скачивание без водяного знака. Разовая оплата — ${formatRub(SKU_KIT_PRICE_RUB)}.`
}: KitOfferBannerProps) {
  const panelClass = darkConsole
    ? "border-accent/30 bg-accent/10 text-white"
    : "border-accent/25 bg-accent/10 text-ink";

  return (
    <div className={`rounded-[18px] border p-4 ${panelClass}`}>
      <p className="text-sm font-black">{title}</p>
      <p className={`mt-1 text-xs font-semibold leading-relaxed ${darkConsole ? "text-white/75" : "text-muted"}`}>
        {description}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {showPaymentButton ? (
          <PaymentButton className="w-full sm:w-auto" count={SKU_KIT_SLIDE_COUNT} metrikaPlan="kit_offer_banner" size="sm">
            {KIT_UNLOCK_CTA}
          </PaymentButton>
        ) : (
          <Button className="w-full sm:w-auto" onClick={onBuyClick} size="sm" type="button">
            {KIT_UNLOCK_CTA}
          </Button>
        )}
      </div>
    </div>
  );
}
