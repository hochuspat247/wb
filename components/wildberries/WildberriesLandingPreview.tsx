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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#CB11AB]/25 bg-card p-6 shadow-[0_24px_80px_rgba(203,17,171,0.18)] md:p-8">
        <button
          aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/15 text-[#CB11AB]">
            <UploadCloud size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Wildberries · Beta</p>
            <h3 className="mt-2 text-2xl font-black leading-snug text-ink">Купите комплект и опубликуйте на WB</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
              Публикация на WB доступна с тарифа «{PLAN_SKU_KIT_NAME}». Сначала соберите комплект слайдов для SKU,
              затем отправьте всё в Wildberries одной кнопкой.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
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
              <div>
                <p className="text-sm font-black text-ink">{step.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[18px] border border-[#CB11AB]/20 bg-[#CB11AB]/8 p-4">
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

        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="flex-1" href="/register">
            <Button className="w-full" variant="secondary">
              Создать аккаунт
            </Button>
          </Link>
          <Link className="flex-1" href="/cabinet#create">
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
      <div className="overflow-hidden rounded-[28px] border border-[#CB11AB]/20 bg-[linear-gradient(160deg,rgba(203,17,171,0.1),rgba(124,255,107,0.05))] p-5 shadow-[0_24px_80px_rgba(203,17,171,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Кабинет → Wildberries</p>
            <h3 className="mt-1 text-lg font-black text-ink">Карусель перед публикацией</h3>
          </div>
          <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-black text-mint">API WB</span>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {mockSlides.map((slide) => (
            <div
              className={`w-[108px] shrink-0 overflow-hidden rounded-[16px] border ${
                slide.accent ? "border-[#CB11AB] shadow-[0_10px_30px_rgba(203,17,171,0.18)]" : "border-clay"
              }`}
              key={slide.label}
            >
              <div className="relative aspect-[4/5] bg-paper">
                <Image
                  alt={slide.label}
                  className="h-full w-full object-cover"
                  fill
                  sizes="108px"
                  src={slide.image}
                />
                {slide.accent ? (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-[#CB11AB] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                    Титульник
                  </span>
                ) : null}
              </div>
              <div className="border-t border-clay/70 bg-card/80 px-2 py-2 text-center text-[11px] font-bold text-ink">
                {slide.label}
              </div>
            </div>
          ))}
          <div className="grid w-[108px] shrink-0 place-items-center gap-1 rounded-[16px] border border-dashed border-[#CB11AB]/40 bg-[#CB11AB]/5 px-2 py-3 text-center">
            <Plus className="text-[#CB11AB]" size={20} />
            <span className="text-[10px] font-black text-ink">Добавить</span>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] border border-clay bg-card/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[12px] border border-clay bg-paper">
                <Image alt="" className="object-cover" fill sizes="44px" src={fanAfter} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">Кроссовки женские оверсайз</p>
                <p className="mt-1 text-xs text-muted">Категория WB · бренд · габариты · вес</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#CB11AB]/12 px-3 py-1 text-xs font-black text-[#CB11AB]">
              <CheckCircle2 size={14} />
              4 фото
            </span>
          </div>
          <button
            className="mt-4 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-button bg-[#CB11AB] text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-105"
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
