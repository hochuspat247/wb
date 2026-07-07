import { HeroBeforeAfterPreview } from "@/components/hero/HeroBeforeAfterPreview";
import { HeroMiniGenerator } from "@/components/hero/HeroMiniGenerator";
import { HeroActions } from "@/components/HeroActions";
import { HeroViewTracker } from "@/components/hero/HeroViewTracker";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="anchor-section relative overflow-hidden pb-6 pt-8 md:pb-8 md:pt-10" id="hero">
      <HeroViewTracker />
      <div className="section-shell relative z-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-8 xl:gap-10">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <Reveal>
              <Badge className="border-clay bg-card/70 text-muted" variant="outline">
                AI для продавцов маркетплейсов
              </Badge>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="hero-title mt-5 text-balance text-[2.1rem] font-black leading-[0.95] tracking-[-0.04em] text-ink sm:text-[2.55rem] md:text-[3.15rem] lg:text-[3.35rem]">
                Сделайте карточку товара из обычного фото за 1 минуту
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-muted md:text-lg">
                Загрузите фото — MarketCard AI создаст обложку 4:5, описание, SEO-ключи и тексты для WB, Ozon, Avito и
                Яндекс Маркета.
              </p>
            </Reveal>

            <Reveal className="mt-5 lg:mt-6" delay={3}>
              <HeroActions />
            </Reveal>
          </div>

          <Reveal className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2" delay={2}>
            <HeroMiniGenerator />
          </Reveal>
        </div>

        <Reveal className="mt-5 md:mt-6" delay={3}>
          <HeroBeforeAfterPreview />
        </Reveal>
      </div>
    </section>
  );
}
