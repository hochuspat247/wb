import { ImageUp, Store, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
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

export function WildberriesLandingSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="wildberries">
      <div className="section-shell">
        <SectionHeader
          kicker="Beta"
          description={`Доступно с комплекта «${PLAN_SKU_KIT_NAME}» — от ${formatRub(starterPack.total)}. Публикуйте карточки из ${BRAND.marketCard} на Wildberries без ручного копирования.`}
          title="Публикация на Wildberries"
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
                  title: "Карусель для одного SKU",
                  text: "Титульник и слайды комплекта собираются в карусель карточки."
                },
                {
                  icon: Store,
                  title: "Правки каталога WB",
                  text: "Подтягиваем карточки из WB — можно поправить тексты и сохранить обратно."
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
                  href="/#pricing"
                >
                  Смотреть тарифы
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-button border border-clay bg-card px-5 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
                  href="/wildberries"
                >
                  Инструкция по API-токену
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
