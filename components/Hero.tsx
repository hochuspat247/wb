import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroStudioPreview } from "@/components/HeroStudioPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-12 md:pb-20 md:pt-18">
      <div className="section-shell relative z-10 grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <div>
          <Reveal>
            <Badge className="mb-7 border-ink/15 bg-card/70 text-ink" variant="outline">
              Инструмент для селлеров WB, Ozon и Avito
            </Badge>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="text-balance text-[2.75rem] font-black leading-[0.95] tracking-normal text-ink md:text-[4.8rem] lg:text-[5.5rem]">
              Карточки товаров, которые выглядят как работа дорогого дизайнера
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-muted md:text-xl">
              Загрузите фото товара — MarketCard AI соберёт название, описание, SEO и премиальную обложку 4:5 для
              маркетплейсов.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/cabinet#create">
                <Button className="w-full sm:w-auto" size="lg">
                  Создать карточку бесплатно
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/#examples">
                <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                  Посмотреть примеры
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm font-semibold text-muted">
              Без карты · 3 тестовые карточки · Экспорт PNG и JSON
            </p>
          </Reveal>
        </div>

        <HeroStudioPreview />
      </div>
    </section>
  );
}
