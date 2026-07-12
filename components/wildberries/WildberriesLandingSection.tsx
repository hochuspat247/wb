import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { WildberriesLandingPreview } from "@/components/wildberries/WildberriesLandingPreview";
import { BRAND } from "@/lib/branding";
import { WB_INTEGRATION_MIN_PACKAGE, calculatePackagePrice, formatRub } from "@/lib/pricing";
import { ImageUp, Store, UploadCloud, Wand2 } from "lucide-react";
import Link from "next/link";

const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);

export function WildberriesLandingSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="wildberries">
      <div className="section-shell">
        <SectionHeader
          kicker="Beta"
          description={`Доступно с тарифа «Рост» — от ${WB_INTEGRATION_MIN_PACKAGE} генераций (${formatRub(starterPack.total)}). Подключите WB API и публикуйте карточки из истории ${BRAND.marketCard} без ручного копирования.`}
          title="Прямая публикация на Wildberries"
        />

        <WildberriesBetaNotice className="mt-6" />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
          <Reveal>
            <div className="space-y-5">
              {[
                {
                  icon: UploadCloud,
                  title: "Фото + тексты в WB одной кнопкой",
                  text: "Название, описание, характеристики и обложка уходят в Wildberries из истории кабинета."
                },
                {
                  icon: ImageUp,
                  title: "Карусель слайдов для карточки",
                  text: "Титульник уже готов. Добавьте слайды из истории, загрузите фото или сгенерируйте пакет инфографики."
                },
                {
                  icon: Store,
                  title: "Просмотр и редактирование карточек WB",
                  text: "Подтягиваем активные карточки и карточки из корзины WB — можно открыть, поправить тексты и сохранить обратно."
                },
                {
                  icon: Wand2,
                  title: "Пакетная генерация после титульника",
                  text: "Когда главное фото уже есть, добиваете серию слайдов пакетом — без повторного ввода данных товара."
                }
              ].map((item) => (
                <div className="flex gap-4 rounded-[20px] border border-clay bg-card p-4" key={item.title}>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/12 text-[#CB11AB]">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{item.text}</p>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-button border border-[#CB11AB] bg-[#CB11AB] px-5 text-sm font-semibold text-white transition hover:-translate-y-px"
                  href="/register"
                >
                  Попробовать с тарифом «Рост»
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-button border border-clay bg-card px-5 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
                  href="/cabinet#settings"
                >
                  Подключить WB API
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <WildberriesLandingPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
