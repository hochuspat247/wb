import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroStudioPreview } from "@/components/HeroStudioPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="section-shell relative z-10 grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <div>
          <Reveal>
            <Badge className="mb-7 border-clay bg-card/70 text-muted" variant="outline">
              AI для продавцов маркетплейсов
            </Badge>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="hero-title text-balance text-[3rem] font-black leading-[0.88] tracking-[-0.045em] text-ink md:text-[5.25rem] lg:text-[6rem]">
              Карточки, которые выглядят{" "}
              <span className="hero-gradient-text bg-gradient-to-r from-accent via-cyan to-violet bg-[length:200%_auto] bg-clip-text text-transparent">
                дороже
              </span>{" "}
              и продают лучше
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-muted md:text-xl">
              Загрузите фото товара — MarketCard AI соберёт название, описание, SEO-ключи и премиальную обложку 4:5
              для Wildberries, Ozon и Avito.
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
                  Смотреть примеры
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm font-semibold text-muted">
              Без карты · 3 тестовые карточки · PNG и JSON экспорт
            </p>
          </Reveal>
        </div>

        <HeroStudioPreview />
      </div>
    </section>
  );
}
