import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MetrikaGoalLink } from "@/components/analytics/MetrikaGoalLink";
import { HeroStudioPreview } from "@/components/HeroStudioPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-12 md:pb-20 md:pt-16">
      <div className="section-shell relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <Reveal>
            <Badge className="mb-7 border-clay bg-card/70 text-muted" variant="outline">
              AI для продавцов маркетплейсов
            </Badge>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="hero-title text-balance text-[2.35rem] font-black leading-[0.92] tracking-[-0.04em] text-ink sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] xl:text-[4.25rem]">
              Карточки, которые выглядят{" "}
              <span className="hero-gradient-text bg-gradient-to-r from-accent via-cyan to-violet bg-[length:200%_auto] bg-clip-text text-transparent">
                дороже
              </span>{" "}
              и продают лучше
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-muted md:text-lg">
              Загрузите фото товара — MarketCard AI соберёт название, описание, SEO-ключи и премиальную обложку 4:5
              для Wildberries, Ozon и Avito.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MetrikaGoalLink goal="click_create_card" href="/cabinet#create">
                <Button className="w-full sm:w-auto" size="lg">
                  Создать карточку бесплатно
                  <ArrowRight size={18} />
                </Button>
              </MetrikaGoalLink>
              <Link href="/#examples">
                <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                  Смотреть примеры
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm font-semibold text-muted">
              Без карты · 1 тестовая карточка · PNG и JSON экспорт
            </p>
          </Reveal>
        </div>

        <HeroStudioPreview />
      </div>
    </section>
  );
}
