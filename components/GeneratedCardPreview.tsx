"use client";

import { forwardRef } from "react";
import type { ProductCardResult } from "@/types/product-card";

type GeneratedCardPreviewProps = {
  card: ProductCardResult | null;
  imageUrl?: string;
  styleName: string;
};

const styleMap: Record<
  string,
  {
    background: string;
    panel: string;
    text: string;
    muted: string;
    badge: string;
    chip: string;
    imagePanel: string;
    glow: string;
  }
> = {
  "Минималистичный": {
    background: "bg-[#f7f8fb]",
    panel: "bg-white/88",
    text: "text-[#0B0D12]",
    muted: "text-gray-600",
    badge: "bg-[#0B0D12] text-white",
    chip: "bg-white text-[#0B0D12]",
    imagePanel: "bg-white",
    glow: "bg-gray-200/70"
  },
  "Премиальный": {
    background: "bg-[radial-gradient(circle_at_20%_12%,#5b4a2f_0%,#191919_42%,#050505_100%)]",
    panel: "bg-white/10",
    text: "text-white",
    muted: "text-white/78",
    badge: "bg-[#d6b56d] text-[#17120a]",
    chip: "bg-[#d6b56d] text-[#17120a]",
    imagePanel: "bg-white/10",
    glow: "bg-[#d6b56d]/30"
  },
  "Яркий": {
    background: "bg-[radial-gradient(circle_at_18%_12%,#ffb84d_0%,#ff5638_42%,#111111_100%)]",
    panel: "bg-white/16",
    text: "text-white",
    muted: "text-white/86",
    badge: "bg-[#ff2e88] text-white",
    chip: "bg-white text-[#9a2f1f]",
    imagePanel: "bg-white/16",
    glow: "bg-[#a7f3d0]/45"
  },
  "Нежный": {
    background: "bg-[linear-gradient(135deg,#fff7ed_0%,#fce7f3_50%,#e0f2fe_100%)]",
    panel: "bg-white/72",
    text: "text-[#2c2535]",
    muted: "text-[#6b5f75]",
    badge: "bg-[#fb7185] text-white",
    chip: "bg-white text-[#be185d]",
    imagePanel: "bg-white/64",
    glow: "bg-[#f9a8d4]/35"
  },
  "Технологичный": {
    background: "bg-[radial-gradient(circle_at_22%_10%,#164e63_0%,#08111f_48%,#020617_100%)]",
    panel: "bg-sky/12",
    text: "text-white",
    muted: "text-sky-100/82",
    badge: "bg-sky text-[#04111f]",
    chip: "bg-sky text-[#04111f]",
    imagePanel: "bg-white/8",
    glow: "bg-sky/30"
  }
};

export const GeneratedCardPreview = forwardRef<HTMLDivElement, GeneratedCardPreviewProps>(
  ({ card, imageUrl, styleName }, ref) => {
    const theme = styleMap[styleName] ?? styleMap["Минималистичный"];
    const benefits = card?.benefits?.slice(0, 2).map(shortenBenefit) ?? ["Загрузите фото", "Получите PNG"];
    const infographic = card?.infographicTexts?.slice(0, 3) ?? ["1:1", "SEO", "PNG"];
    const marketplace = card?.marketplace ?? "WB / Ozon";
    const category = card?.category ?? "Категория";
    const title = compactTitle(card?.title ?? "Название товара для маркетплейса", marketplace);
    const mainOffer = benefits[0] ?? "Готово к продаже";

    return (
      <div
        className={`marketplace-card relative mx-auto aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-[24px] border border-ink/15 shadow-soft ${theme.background} ${theme.text}`}
        ref={ref}
      >
        <div className={`absolute -left-[12%] top-[9%] h-[48%] w-[48%] rounded-full blur-3xl ${theme.glow}`} />
        <div className={`absolute -right-[10%] bottom-[5%] h-[42%] w-[42%] rounded-full blur-3xl ${theme.glow}`} />

        <div className="absolute left-[5%] right-[5%] top-[4%] z-20 flex items-center justify-between gap-3">
          <span className={`rounded-full px-4 py-2 text-[13px] font-black uppercase ${theme.badge}`}>{marketplace}</span>
          <span className={`rounded-full px-4 py-2 text-[13px] font-black ${theme.panel}`}>Формат 4:5</span>
        </div>

        <div className="absolute left-[5%] top-[14%] z-20 max-w-[86%]">
          <p className={`mb-3 inline-flex rounded-full px-4 py-2 text-[13px] font-black ${theme.panel}`}>{category}</p>
          <h3 className="marketplace-title max-w-[11.5em] font-black leading-[0.96] tracking-normal">{title}</h3>
        </div>

        {!imageUrl ? (
          <div className={`absolute bottom-[10%] left-[5%] z-10 h-[48%] w-[50%] overflow-hidden rounded-[26px] ${theme.imagePanel}`}>
            <div className="absolute inset-4 rounded-[20px] bg-white/10" />
            <div className={`relative z-10 grid h-full place-items-center px-6 text-center text-sm font-bold ${theme.muted}`}>
              Загрузите фото товара
            </div>
          </div>
        ) : (
          <div className={`absolute bottom-[10%] left-[5%] z-10 h-[48%] w-[50%] overflow-hidden rounded-[26px] ${theme.imagePanel}`}>
            <div className="absolute inset-4 rounded-[20px] bg-white/10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Загруженный товар" className="relative z-10 h-full w-full object-contain p-[6%] drop-shadow-2xl" src={imageUrl} />
          </div>
        )}

        <div className="absolute bottom-[13%] right-[5%] z-20 flex w-[40%] flex-col gap-3">
          <div className={`rounded-[22px] px-4 py-4 ${theme.panel}`}>
            <p className="marketplace-benefit font-black leading-tight">{mainOffer}</p>
          </div>
          {benefits[1] ? (
            <div className={`rounded-[22px] px-4 py-4 ${theme.panel}`}>
              <p className={`marketplace-benefit-sm font-black leading-tight ${theme.muted}`}>{benefits[1]}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2">
            {infographic.map((item) => (
              <div className={`rounded-2xl px-3 py-3 text-center text-[15px] font-black ${theme.chip}`} key={item}>
                {item.slice(0, 18)}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-[4%] left-[5%] right-[5%] z-30 flex items-center justify-between gap-3">
          <span className={`rounded-full px-4 py-2 text-[13px] font-black ${imageUrl ? "bg-mint text-paper" : theme.panel}`}>
            {imageUrl ? "С вашим фото" : "Нужно фото"}
          </span>
          <span className={`rounded-full px-4 py-2 text-[13px] font-black ${theme.badge}`}>Готово к публикации</span>
        </div>
      </div>
    );
  }
);

GeneratedCardPreview.displayName = "GeneratedCardPreview";

function compactTitle(title: string, marketplace: string) {
  return title
    .replace(new RegExp(`\\s*-?\\s*готовая карточка для ${marketplace}`, "i"), "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 78);
}

function shortenBenefit(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace("Описание можно быстро адаптировать под разные площадки", "Легко адаптировать")
    .replace("Подходит для повседневного использования или подарка", "Для себя и подарка")
    .trim()
    .slice(0, 58);
}
