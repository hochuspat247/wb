import Image from "next/image";
import heroCardImage from "@/publick/7ab15fea-2529-4185-bd93-c8bfff5dee2e.png";
import { Reveal } from "@/components/ui/Reveal";

export function HeroStudioPreview() {
  return (
    <Reveal delay={2}>
      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle,rgba(124,255,107,0.18),transparent_68%)] blur-2xl animate-glow-pulse"
        />

        <div className="studio-noise relative overflow-hidden rounded-container border border-clay bg-card p-4 shadow-soft md:p-5">
          <div className="relative z-10 animate-float overflow-hidden rounded-[24px] border border-white/10">
            <Image
              alt="Пример карточки товара MarketCard AI"
              className="aspect-[4/5] w-full object-cover"
              priority
              src={heroCardImage}
            />

            <span className="absolute left-4 top-4 rounded-full bg-mint px-3 py-1.5 text-xs font-black text-paper shadow-[0_8px_24px_rgba(124,255,107,0.35)]">
              4:5 marketplace
            </span>
            <span className="absolute bottom-4 right-4 rounded-full bg-card px-3 py-1.5 text-xs font-black text-ink">
              PNG готов
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
