import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
import { CardVideoCompareSlider } from "@/components/video/CardVideoCompareSlider";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { PRODUCT_CARD_VIDEO_DEMO } from "@/lib/marketing/videoExample";

export function VideoExampleSection() {
  return (
    <section className="border-t border-clay bg-card py-20 md:py-28" id="video-example">
      <div className="section-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-12 xl:gap-16">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-clay bg-paper/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <Film size={14} />
                {PRODUCT_CARD_VIDEO_DEMO.kicker}
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.02] tracking-normal text-ink md:text-[3rem]">
                {PRODUCT_CARD_VIDEO_DEMO.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
                {PRODUCT_CARD_VIDEO_DEMO.description}
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {PRODUCT_CARD_VIDEO_DEMO.features.map((item) => (
                  <li className="flex items-start gap-2 text-sm font-semibold text-muted" key={item}>
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/cabinet#create">
                  <Button type="button">
                    Создать видео из карточки
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/#generator">
                  <Button type="button" variant="secondary">
                    Сначала сделать карточку
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none">
              <CardVideoCompareSlider
                alt={PRODUCT_CARD_VIDEO_DEMO.title}
                badge={PRODUCT_CARD_VIDEO_DEMO.badge}
                cardImage={PRODUCT_CARD_VIDEO_DEMO.cardImage}
                duration={PRODUCT_CARD_VIDEO_DEMO.durationLabel}
                label={PRODUCT_CARD_VIDEO_DEMO.compareLabel}
                videoSrc={PRODUCT_CARD_VIDEO_DEMO.src}
              />
              <p className="mt-3 text-center text-xs font-medium text-muted lg:text-left">
                Потяните ползунок, чтобы сравнить карточку и видео
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
