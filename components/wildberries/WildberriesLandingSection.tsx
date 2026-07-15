import { ImageUp, Store, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { WildberriesLandingPreview } from "@/components/wildberries/WildberriesLandingPreview";
import { BRAND } from "@/lib/branding";
import {
  PLAN_SKU_KIT_NAME,
  WB_INTEGRATION_MIN_PACKAGE,
  calculatePackagePrice,
  formatRub
} from "@/lib/pricing";

const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);

const features = [
  {
    icon: UploadCloud,
    title: "Фото + тексты в WB одной кнопкой",
    text: "Название, описание, характеристики и обложка уходят в Wildberries из истории кабинета."
  },
  {
    icon: ImageUp,
    title: "Карусель для одного SKU",
    text: "Титульник и слайды комплекта собираются в карусель карточки."
  },
  {
    icon: Store,
    title: "Правки каталога WB",
    text: "Подтягиваем карточки из WB — можно поправить тексты и сохранить обратно."
  }
] as const;

export function WildberriesLandingSection() {
  return (
    <section className="overflow-x-hidden border-t border-clay bg-paper py-16 md:py-28" id="wildberries">
      <div className="section-shell">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-[#CB11AB]/25 bg-[#CB11AB]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#CB11AB]">
              Beta
            </span>
            <h2 className="font-display mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.75rem]">
              Публикация на Wildberries
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-lg">
              Доступно с комплекта «{PLAN_SKU_KIT_NAME}» — от {formatRub(starterPack.total)}. Публикуйте карточки из{" "}
              {BRAND.marketCard} на Wildberries без ручного копирования.
            </p>
          </div>
        </Reveal>

        <WildberriesBetaNotice className="mt-5 md:mt-6" />

        <div className="mt-8 grid items-start gap-6 md:mt-12 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
          <Reveal className="order-2 lg:order-1">
            <div className="space-y-3 md:space-y-4">
              {features.map((item) => (
                <div
                  className="flex gap-3 rounded-[18px] border border-clay bg-card p-3.5 sm:gap-4 sm:rounded-[20px] sm:p-4"
                  key={item.title}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CB11AB]/12 text-[#CB11AB] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink sm:text-base">{item.title}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-muted sm:text-sm">{item.text}</p>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-button border border-[#CB11AB] bg-[#CB11AB] px-5 text-sm font-semibold text-white transition hover:-translate-y-px sm:w-auto"
                  href="/#pricing"
                >
                  Смотреть тарифы
                </Link>
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-button border border-clay bg-card px-5 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35 sm:w-auto"
                  href="/wildberries"
                >
                  Инструкция по API-токену
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal className="order-1 min-w-0 lg:order-2" delay={2}>
            <WildberriesLandingPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
