import Image from "next/image";
import beforeImage from "@/publick/f5951788-06f3-44ef-8219-4eb442eaa4c9.png";
import afterImage from "@/publick/7ab15fea-2529-4185-bd93-c8bfff5dee2e.png";
import { Reveal } from "@/components/ui/Reveal";

function FrameHandle({ className }: { className: string }) {
  return <span className={`absolute z-10 h-2.5 w-2.5 rounded-full border-2 bg-paper ${className}`} />;
}

export function HeroStudioPreview() {
  return (
    <Reveal delay={2}>
      <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:ml-auto lg:max-w-[480px] xl:max-w-[520px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_30%_70%,rgba(140,123,255,0.18),transparent_55%),radial-gradient(circle_at_75%_20%,rgba(124,255,107,0.16),transparent_50%)] blur-2xl"
        />

        <div className="relative min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[18%] top-[34%] z-10 h-[42%] w-[58%] text-accent/80"
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

          <div className="absolute right-0 top-0 z-20 w-[58%] animate-float">
            <div className="relative rounded-[22px] border-2 border-accent/85 bg-card/40 p-1.5 shadow-[0_24px_70px_rgba(124,255,107,0.18)] backdrop-blur-sm">
              <FrameHandle className="-left-1.5 -top-1.5 border-accent" />
              <FrameHandle className="-right-1.5 -top-1.5 border-accent" />
              <FrameHandle className="-bottom-1.5 -left-1.5 border-accent" />
              <FrameHandle className="-bottom-1.5 -right-1.5 border-accent" />

              <div className="relative overflow-hidden rounded-[16px] border border-white/10">
                <Image
                  alt="Готовая карточка товара"
                  className="aspect-[4/5] w-full object-cover object-top"
                  priority
                  sizes="(max-width: 1024px) 240px, 300px"
                  src={afterImage}
                />
                <span className="absolute left-3 top-3 rounded-full bg-mint px-2.5 py-1 text-[10px] font-black text-paper">
                  4:5
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-black text-ink">
                  PNG готов
                </span>
              </div>
            </div>

            <p className="mt-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Готовая карточка
            </p>
          </div>

          <div className="absolute bottom-0 left-0 z-30 w-[50%]">
            <div className="relative rounded-[20px] border-2 border-dashed border-violet/55 bg-card/70 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <FrameHandle className="-left-1.5 -top-1.5 border-violet" />
              <FrameHandle className="-right-1.5 -top-1.5 border-violet" />
              <FrameHandle className="-bottom-1.5 -left-1.5 border-violet" />
              <FrameHandle className="-bottom-1.5 -right-1.5 border-violet" />

              <div className="relative flex aspect-[4/5] overflow-hidden rounded-[14px] border border-white/10">
                <div className="relative h-full w-[56%] bg-white">
                  <Image
                    alt="Исходное фото товара"
                    className="object-contain p-2"
                    fill
                    priority
                    sizes="(max-width: 1024px) 120px, 150px"
                    src={beforeImage}
                  />
                </div>
                <div className="hero-checker h-full flex-1" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-paper shadow-sm">
                  До
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-violet">
              Исходное фото
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-[18%] left-[44%] z-40 rounded-full border border-clay bg-card/90 px-3 py-1.5 text-[11px] font-bold text-ink shadow-soft backdrop-blur-sm">
            AI за ~2 мин
          </div>
        </div>
      </div>
    </Reveal>
  );
}
