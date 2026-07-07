"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/Button";
import {
  GENERATION_PACKAGES,
  calculatePackagePrice,
  formatRub
} from "@/lib/pricing";

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  useEffect(() => {
    if (open) {
      trackConversion("paywall_view");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-clay bg-card p-6 shadow-soft md:p-8">
        <button
          aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Бесплатные генерации использованы</p>
        <h3 className="mt-3 text-2xl font-black text-ink">Купите пакет генераций</h3>
        <p className="mt-2 text-sm font-medium text-muted">
          Вы уже протестировали сервис. Выберите пакет — оплата пройдет через защищенную страницу ЮKassa.
        </p>

        <div className="mt-6 grid gap-3">
          {GENERATION_PACKAGES.map((pack) => {
            const price = calculatePackagePrice(pack.count);

            return (
              <div
                className="grid gap-4 rounded-[18px] border border-clay bg-paper/40 px-4 py-4 sm:grid-cols-[1fr_auto]"
                key={pack.id}
              >
                <div>
                  <p className="font-black text-ink">{pack.label}</p>
                  <p className="mt-1 text-xs font-medium text-muted">{pack.description}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-black text-ink">{formatRub(price.total)}</p>
                  <p className="text-xs font-semibold text-muted">{formatRub(price.pricePerUnit)} / шт</p>
                  <PaymentButton className="mt-3 min-w-36" count={pack.count} size="sm">
                    Купить
                  </PaymentButton>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <PaymentButton className="flex-1" count={10}>
            Купить пакет
          </PaymentButton>
          <Link className="flex-1" href="/#pricing-calculator" onClick={onClose}>
            <Button className="w-full" variant="secondary">
              Рассчитать пакет
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
