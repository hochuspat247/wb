import { HeroBeforeAfterPreview } from "@/components/hero/HeroBeforeAfterPreview";
import { HeroBenefits } from "@/components/hero/HeroBenefits";
import { HeroMiniGenerator } from "@/components/hero/HeroMiniGenerator";
import { HeroActions } from "@/components/HeroActions";
import { HeroViewTracker } from "@/components/hero/HeroViewTracker";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-10 md:pb-14 md:pt-14" id="hero">
      <HeroViewTracker />
      <div className="section-shell relative z-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-10 xl:gap-12">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <Reveal>
              <Badge className="border-clay bg-card/70 text-muted" variant="outline">
                AI для продавцов маркетплейсов
              </Badge>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="hero-title mt-7 text-balance text-[2.1rem] font-black leading-[0.95] tracking-[-0.04em] text-ink sm:text-[2.55rem] md:text-[3.15rem] lg:text-[3.45rem]">
                Сделайте карточку товара из обычного фото за 1 минуту
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted md:text-lg">
                Загрузите фото — MarketCard AI создаст обложку 4:5, описание, SEO-ключи и тексты для WB, Ozon, Avito и
                Яндекс Маркета.
              </p>
            </Reveal>
          </div>

          <Reveal className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-3" delay={2}>
            <HeroMiniGenerator />
          </Reveal>

          <Reveal className="order-3 hidden lg:col-start-1 lg:row-start-2 lg:block" delay={3}>
            <HeroBenefits />
          </Reveal>

          <Reveal className="order-4 lg:col-start-1 lg:row-start-3" delay={4}>
            <HeroActions />
          </Reveal>

          <Reveal className="order-5 lg:col-span-2 lg:row-start-4" delay={3}>
            <HeroBeforeAfterPreview />
          </Reveal>

          <Reveal className="order-6 lg:hidden" delay={4}>
            <HeroBenefits />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
