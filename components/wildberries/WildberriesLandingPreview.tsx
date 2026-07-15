"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { CheckCircle2, Plus, Sparkles, UploadCloud, Wand2, X } from "lucide-react";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/Button";
import { PLAN_SKU_KIT_NAME, WB_INTEGRATION_MIN_PACKAGE, calculatePackagePrice, formatRub, kitBuyCta } from "@/lib/pricing";
import fanAfter from "@/publick/70a7dada-44df-4fe2-84bb-22290fbc0aa7.png";
import steamerAfter from "@/publick/b96119e8-f03b-43dc-8f66-c52a0b4ed245.png";
import waterTesterAfter from "@/publick/bdc93c3d-6c98-45de-bd5f-58f0e4618213.png";
import faceCreamAfter from "@/publick/8270a01e-bd48-4474-b18d-1a3b6eb2e6fc.png";

const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);

const mockSlides: Array<{ label: string; accent?: boolean; image: StaticImageData }> = [
  { label: "Титульник", accent: true, image: fanAfter },
  { label: "Преимущества", image: steamerAfter },
  { label: "Характеристики", image: waterTesterAfter },
  { label: "Как использовать", image: faceCreamAfter }
];

type WildberriesSubscribeModalProps = {
  open: boolean;
  onClose: () => void;
};

function WildberriesSubscribeModal({ open, onClose }: WildberriesSubscribeModalProps) {
  useEffect(() => {
    if (open) {
      trackConversion("paywall_view", { source: "wb_landing_preview" });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] border border-[#CB11AB]/25 bg-card p-5 shadow-[0_24px_80px_rgba(203,17,171,0.18)] sm:max-h-[90vh] sm:max-w-lg sm:rounded-[28px] sm:p-6 md:p-8">
        <button
          aria-label="Закрыть"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:text-ink sm:right-4 sm:top-4"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/15 text-[#CB11AB] sm:h-11 sm:w-11">
            <UploadCloud size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#CB11AB] sm:text-xs">
              Wildberries · Beta
            </p>
            <h3 className="mt-2 text-xl font-black leading-snug text-ink sm:text-2xl">
              Купите комплект и опубликуйте на WB
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
              Публикация на WB доступна с тарифа «{PLAN_SKU_KIT_NAME}». Сначала соберите комплект слайдов для SKU, затем
              отправьте всё в Wildberries одной кнопкой.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
          {[
            {
              icon: Sparkles,
              title: `1. ${PLAN_SKU_KIT_NAME}`,
              text: `${WB_INTEGRATION_MIN_PACKAGE} слайдов — ${formatRub(starterPack.total)}`
            },
            {
              icon: Wand2,
              title: "2. Соберите комплект",
              text: "Обложка + преимущества, характеристики и сценарий использования"
            },
            {
              icon: UploadCloud,
              title: "3. Опубликуйте на WB",
              text: "Фото и тексты уйдут в карточку Wildberries из кабинета"
            }
          ].map((step) => (
            <div className="flex gap-3 rounded-[16px] border border-clay bg-paper/50 p-3" key={step.title}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#CB11AB]/10 text-[#CB11AB]">
                <step.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">{step.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[18px] border border-[#CB11AB]/20 bg-[#CB11AB]/8 p-4 sm:mt-6">
          <p className="text-sm font-black text-ink">
            {PLAN_SKU_KIT_NAME} — {formatRub(starterPack.total)}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {formatRub(starterPack.pricePerUnit)} за слайд · публикация на WB · карусель для одного SKU
          </p>
          <PaymentButton
            className="mt-4 w-full"
            count={WB_INTEGRATION_MIN_PACKAGE}
            metrikaPlan="wb_landing_pack5"
          >
            {kitBuyCta()}
          </PaymentButton>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link className="w-full sm:flex-1" href="/register">
            <Button className="w-full" variant="secondary">
              Создать аккаунт
            </Button>
          </Link>
          <Link className="w-full sm:flex-1" href="/cabinet#create">
            <Button className="w-full" variant="ghost">
              Сгенерировать карточки
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function WildberriesLandingPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-[22px] border border-[#CB11AB]/20 bg-[linear-gradient(160deg,rgba(203,17,171,0.1),rgba(191,249,63,0.08))] p-3.5 shadow-[0_24px_80px_rgba(203,17,171,0.1)] sm:rounded-[28px] sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#CB11AB] sm:text-xs sm:tracking-[0.16em]">
              Кабинет → Wildberries
            </p>
            <h3 className="mt-1 text-base font-black leading-snug text-ink sm:text-lg">Карусель перед публикацией</h3>
          </div>
          <span className="shrink-0 rounded-full bg-accent/25 px-2.5 py-1 text-[10px] font-black text-accent-ink sm:px-3 sm:text-xs">
            API WB
          </span>
        </div>

        <div className="-mx-0.5 mt-4 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 sm:gap-3 [&::-webkit-scrollbar]:hidden">
          {mockSlides.map((slide) => (
            <div
              className={`w-[86px] shrink-0 overflow-hidden rounded-[14px] border sm:w-[108px] sm:rounded-[16px] ${
                slide.accent ? "border-[#CB11AB] shadow-[0_10px_30px_rgba(203,17,171,0.18)]" : "border-clay"
              }`}
              key={slide.label}
            >
              <div className="relative aspect-[4/5] bg-paper">
                <Image
                  alt={slide.label}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(max-width:640px) 86px, 108px"
                  src={slide.image}
                />
                {slide.accent ? (
                  <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[#CB11AB] px-1.5 py-0.5 text-[8px] font-black uppercase text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[9px]">
                    Титульник
                  </span>
                ) : null}
              </div>
              <div className="truncate border-t border-clay/70 bg-card/80 px-1.5 py-1.5 text-center text-[10px] font-bold text-ink sm:px-2 sm:py-2 sm:text-[11px]">
                {slide.label}
              </div>
            </div>
          ))}
          <div className="grid w-[86px] shrink-0 place-items-center gap-1 rounded-[14px] border border-dashed border-[#CB11AB]/40 bg-[#CB11AB]/5 px-2 py-3 text-center sm:w-[108px] sm:rounded-[16px]">
            <Plus className="text-[#CB11AB]" size={18} />
            <span className="text-[10px] font-black text-ink">Добавить</span>
          </div>
        </div>

        <div className="mt-4 rounded-[16px] border border-clay bg-card/80 p-3 sm:mt-5 sm:rounded-[18px] sm:p-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[10px] border border-clay bg-paper sm:h-14 sm:w-11 sm:rounded-[12px]">
                <Image alt="" className="object-cover" fill sizes="44px" src={fanAfter} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-ink">Кроссовки женские оверсайз</p>
                <p className="mt-0.5 truncate text-[11px] text-muted sm:mt-1 sm:text-xs">
                  Категория WB · бренд · габариты · вес
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#CB11AB]/12 px-2.5 py-1 text-[11px] font-black text-[#CB11AB] sm:px-3 sm:text-xs">
              <CheckCircle2 size={13} />
              4 фото
            </span>
          </div>
          <button
            className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-button bg-[#CB11AB] px-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-105 sm:mt-4"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Опубликовать на Wildberries
          </button>
        </div>
      </div>

      <WildberriesSubscribeModal onClose={() => setModalOpen(false)} open={modalOpen} />
    </>
  );
}
