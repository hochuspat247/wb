import Image from "next/image";
import beforeImage from "@/publick/f5951788-06f3-44ef-8219-4eb442eaa4c9.png";
import afterImage from "@/publick/7ab15fea-2529-4185-bd93-c8bfff5dee2e.png";

export function HeroBeforeAfterPreview() {
  return (
    <div className="rounded-[22px] border border-clay/80 bg-card/45 p-4 md:p-5">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-muted">До и после</p>
      <div className="mx-auto grid max-w-2xl items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="overflow-hidden rounded-[16px] border border-clay bg-paper">
          <Image
            alt="Исходное фото товара"
            className="aspect-[4/5] w-full object-cover"
            sizes="(max-width: 640px) 42vw, 180px"
            src={beforeImage}
          />
          <p className="px-3 py-2 text-center text-xs font-bold text-muted">Исходное фото</p>
        </div>

        <div className="hidden text-sm font-black text-accent sm:block">→</div>

        <div className="overflow-hidden rounded-[16px] border border-accent/40 bg-paper">
          <Image
            alt="Готовая карточка товара"
            className="aspect-[4/5] w-full object-cover object-top"
            sizes="(max-width: 640px) 42vw, 180px"
            src={afterImage}
          />
          <p className="px-3 py-2 text-center text-xs font-bold text-mint">Готовая карточка 4:5</p>
        </div>
      </div>
    </div>
  );
}
