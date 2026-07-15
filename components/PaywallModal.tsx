"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Film, Sparkles, X } from "lucide-react";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/Button";
import {
  KIT_SERIES_DESCRIPTION,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_PRICE_RUB,
  SKU_KIT_SLIDE_COUNT,
  calculatePackagePrice,
  describeFreeQuotaMarketing,
  describeMonthlyFreeReset,
  formatRub
} from "@/lib/pricing";
import {
  VIDEO_RESULT_UPSELL_DURATION_LABEL,
  VIDEO_RESULT_UPSELL_PRICE_LABEL
} from "@/lib/marketing/videoUpsell";

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  onCreateVideo?: () => void;
  monthlyFreeResetsAt?: string | null;
  variant?: "series" | "quota_exhausted";
};

export function PaywallModal({
  open,
  onClose,
  onCreateVideo,
  monthlyFreeResetsAt: _monthlyFreeResetsAt,
  variant = "series"
}: PaywallModalProps) {
  const skuKit = calculatePackagePrice(SKU_KIT_SLIDE_COUNT);
  const catalogPack = calculatePackagePrice(20);

  useEffect(() => {
    if (open) {
      trackConversion("paywall_view", { variant });
    }
  }, [open, variant]);

  if (!open) return null;

  const title =
    variant === "quota_exhausted"
      ? "Пробные карточки использованы — соберите комплект"
      : `${PLAN_SKU_KIT_NAME} — ${formatRub(SKU_KIT_PRICE_RUB)}`;

  const lead =
    variant === "quota_exhausted"
      ? `Вы использовали ${describeFreeQuotaMarketing().toLowerCase()}. ${describeMonthlyFreeReset()}. Карточка сохранена с водяным знаком — купите комплект, чтобы скачать без метки и собрать серию.`
      : `Бесплатно — только одиночные карточки с водяным знаком. ${KIT_SERIES_DESCRIPTION} — в комплекте.`;

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

        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
              {variant === "quota_exhausted" ? "Пробный лимит" : "Комплект"}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-snug text-ink">{title}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{lead}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[18px] border border-accent/25 bg-accent/10 p-4">
            <p className="text-sm font-black text-ink">
              {PLAN_SKU_KIT_NAME} — {formatRub(skuKit.total)}
            </p>
            <ul className="mt-2 space-y-1 text-xs font-semibold text-muted">
              <li>{KIT_SERIES_DESCRIPTION}</li>
              <li>Скачивание без водяного знака</li>
              <li>Разовая оплата, без подписки</li>
            </ul>
            <PaymentButton className="mt-4" count={SKU_KIT_SLIDE_COUNT} metrikaPlan="paywall_sku_kit">
              Купить комплект
            </PaymentButton>
          </div>

          <div className="rounded-[18px] border border-clay bg-paper/50 p-4">
            <p className="text-sm font-black text-ink">Каталог — {formatRub(catalogPack.total)}</p>
            <p className="mt-1 text-xs font-semibold text-muted">
              20 слайдов · до 4 комплектов SKU · приоритетная очередь
            </p>
            <PaymentButton className="mt-4" count={20} metrikaPlan="paywall_catalog" variant="secondary">
              Купить каталог
            </PaymentButton>
          </div>

          {onCreateVideo ? (
            <div className="rounded-[18px] border border-clay bg-paper/50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-ink">
                <Film size={16} />
                Видео из карточки — от {VIDEO_RESULT_UPSELL_PRICE_LABEL}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                Короткий ролик {VIDEO_RESULT_UPSELL_DURATION_LABEL} после готового изображения
              </p>
              <Button className="mt-4 w-full" onClick={onCreateVideo} type="button" variant="secondary">
                Создать видео из этой карточки
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link className="flex-1" href="/#pricing" onClick={onClose}>
            <Button className="w-full" variant="ghost">
              Все тарифы
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
