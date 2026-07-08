import { HeroBeforeAfterPreview } from "@/components/hero/HeroBeforeAfterPreview";
import { HeroMiniGenerator } from "@/components/hero/HeroMiniGenerator";
import { HeroActions } from "@/components/HeroActions";
import { HeroViewTracker } from "@/components/hero/HeroViewTracker";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="anchor-section relative overflow-hidden pb-6 pt-8 md:pb-8 md:pt-12" id="hero">
      <HeroViewTracker />
      <div className="section-shell relative z-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-10 xl:gap-12">
          <div className="hero-copy order-1 lg:col-start-1 lg:row-start-1">
            <div aria-hidden className="hero-copy-glow" />

            <Reveal immediate>
              <Badge className="border-clay/80 bg-card/50 text-muted backdrop-blur-sm" variant="outline">
                AI для продавцов маркетплейсов
              </Badge>
            </Reveal>

            <Reveal delay={1} immediate>
              <h1 className="hero-title mt-7 max-w-[14ch] text-balance text-[2.15rem] font-black leading-[1.08] text-ink sm:mt-8 sm:max-w-[16ch] sm:text-[2.7rem] sm:leading-[1.06] md:text-[3.35rem] lg:text-[3.55rem] lg:leading-[1.04]">
                Сделайте карточку товара из обычного фото{" "}
                <span className="hero-title-accent">за 1 минуту</span>
              </h1>
            </Reveal>

            <Reveal delay={2} immediate>
              <p className="hero-lead mt-7 max-w-[34rem] text-[1.05rem] font-medium leading-[1.8] text-muted/90 sm:mt-8 sm:text-lg sm:leading-[1.85] md:mt-9 md:text-[1.15rem]">
                Загрузите фото — MarketCard AI создаст обложку 4:5, описание, SEO-ключи и тексты для WB, Ozon, Avito и
                Яндекс Маркета. После карточки можно оживить её в короткое видео без звука прямо из кабинета.
              </p>
            </Reveal>

            <Reveal className="mt-8 sm:mt-10 md:mt-11" delay={3} immediate>
              <HeroActions />
            </Reveal>
          </div>

          <Reveal className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2" delay={2} immediate>
            <HeroMiniGenerator />
          </Reveal>
        </div>

        <Reveal className="mt-6 md:mt-8" delay={4}>
          <HeroBeforeAfterPreview />
        </Reveal>
      </div>
    </section>
  );
}
