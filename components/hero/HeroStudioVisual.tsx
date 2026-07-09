import Image from "next/image";
import beforeImage from "@/publick/f5951788-06f3-44ef-8219-4eb442eaa4c9.png";
import afterImage from "@/publick/7ab15fea-2529-4185-bd93-c8bfff5dee2e.png";

function FrameHandle({ className }: { className: string }) {
  return <span className={`absolute z-10 h-2 w-2 rounded-full border-2 bg-paper ${className}`} />;
}

export function HeroStudioVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full min-w-0 ${className}`.trim()}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[32px] bg-[radial-gradient(circle_at_30%_70%,rgba(140,123,255,0.18),transparent_55%),radial-gradient(circle_at_75%_20%,rgba(124,255,107,0.16),transparent_50%)] blur-2xl sm:inset-4"
      />

      <div className="relative mx-auto w-full max-w-[380px] px-1 sm:max-w-[420px] lg:mx-0 lg:max-w-[460px]">
        <div className="relative h-[280px] sm:h-[300px] lg:h-[340px]">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[20%] top-[30%] z-10 h-[40%] w-[56%] text-accent/70"
            fill="none"
            viewBox="0 0 220 120"
          >
            <path
              className="hero-flow-path"
              d="M12 98 C70 108, 95 24, 205 18"
              stroke="currentColor"
              strokeDasharray="7 8"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              className="hero-flow-head"
              d="M194 10 L208 18 L194 26"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          </svg>

          <div className="absolute right-1 top-1 z-20 w-[52%] sm:right-2 sm:top-2 lg:animate-float">
            <div className="relative rounded-[18px] border-2 border-accent/85 bg-card/40 p-1 shadow-[0_20px_60px_rgba(124,255,107,0.16)] backdrop-blur-sm sm:rounded-[20px] sm:p-1.5">
              <FrameHandle className="left-1.5 top-1.5 border-accent" />
              <FrameHandle className="right-1.5 top-1.5 border-accent" />
              <FrameHandle className="bottom-1.5 left-1.5 border-accent" />
              <FrameHandle className="bottom-1.5 right-1.5 border-accent" />

              <div className="relative overflow-hidden rounded-[14px] border border-white/10 sm:rounded-[15px]">
                <Image
                  alt="Готовая карточка товара"
                  className="aspect-[4/5] w-full object-cover object-top"
                  sizes="(max-width: 1024px) 200px, 260px"
                  src={afterImage}
                />
                <span className="absolute left-2 top-2 rounded-full bg-mint px-2 py-0.5 text-[9px] font-black text-paper sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  4:5
                </span>
                <span className="absolute bottom-2 right-2 rounded-full bg-card/95 px-2 py-0.5 text-[9px] font-black text-ink sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  PNG готов
                </span>
              </div>
            </div>

            <p className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-accent sm:mt-2.5 sm:text-xs">
              Готовая карточка
            </p>
          </div>

          <div className="absolute bottom-7 left-1 z-30 w-[44%] sm:bottom-8 sm:left-2 sm:w-[45%]">
            <div className="relative rounded-[16px] border-2 border-dashed border-violet/55 bg-card/70 p-1 shadow-[0_16px_44px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:rounded-[18px] sm:p-1.5">
              <FrameHandle className="left-1.5 top-1.5 border-violet" />
              <FrameHandle className="right-1.5 top-1.5 border-violet" />
              <FrameHandle className="bottom-1.5 left-1.5 border-violet" />
              <FrameHandle className="bottom-1.5 right-1.5 border-violet" />

              <div className="relative flex aspect-[4/5] overflow-hidden rounded-[12px] border border-white/10 sm:rounded-[13px]">
                <div className="relative h-full w-[56%] bg-white">
                  <Image
                    alt="Исходное фото товара"
                    className="object-contain p-1.5 sm:p-2"
                    fill
                    sizes="(max-width: 1024px) 110px, 140px"
                    src={beforeImage}
                  />
                </div>
                <div className="hero-checker h-full flex-1" />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-paper shadow-sm sm:left-2.5 sm:top-2.5 sm:px-2 sm:text-[10px]">
                  До
                </span>
              </div>
            </div>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-violet sm:mt-2.5 sm:text-xs">
              Исходное фото
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-[30%] left-1/2 z-40 -translate-x-1/2 rounded-full border border-clay bg-card/95 px-2.5 py-1 text-[10px] font-bold text-ink shadow-soft backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[11px]">
            ИИ за ~2 мин
          </div>
        </div>
      </div>
    </div>
  );
}
