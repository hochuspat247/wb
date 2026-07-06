import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroStudioPreview } from "@/components/HeroStudioPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="section-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <Badge className="mb-6" variant="outline">
              Для продавцов WB, Ozon и Avito
            </Badge>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-tight text-ink md:text-[3.5rem] lg:text-[4rem]">
              Карточки товаров, которые выглядят дороже и продают лучше
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Загрузите фото товара — MarketCard AI подготовит название, описание, SEO-ключи и премиальную обложку 4:5
              для маркетплейсов.
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
            <p className="mt-5 text-sm font-medium text-muted">
              Без карты · 3 тестовые карточки · Экспорт PNG и JSON
            </p>
          </Reveal>
        </div>

        <HeroStudioPreview />
      </div>
    </section>
  );
}
