import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { BRAND } from "@/lib/branding";
import { WB_INTEGRATION_MIN_PACKAGE, calculatePackagePrice, formatRub } from "@/lib/pricing";
import { CheckCircle2, ImageUp, Plus, Store, UploadCloud, Wand2 } from "lucide-react";
import Link from "next/link";

const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);

const mockSlides = [
  { label: "Титульник", accent: true },
  { label: "Преимущества" },
  { label: "Характеристики" },
  { label: "Как использовать" }
];

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
            <div className="overflow-hidden rounded-[28px] border border-[#CB11AB]/20 bg-[linear-gradient(160deg,rgba(203,17,171,0.1),rgba(124,255,107,0.05))] p-5 shadow-[0_24px_80px_rgba(203,17,171,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Кабинет → История → WB</p>
                  <h3 className="mt-1 text-lg font-black text-ink">Карусель перед публикацией</h3>
                </div>
                <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-black text-mint">API WB</span>
              </div>

              <div className="mt-5 flex gap-3 overflow-hidden">
                {mockSlides.map((slide) => (
                  <div
                    className={`w-[108px] shrink-0 overflow-hidden rounded-[16px] border ${
                      slide.accent ? "border-[#CB11AB] shadow-[0_10px_30px_rgba(203,17,171,0.18)]" : "border-clay"
                    }`}
                    key={slide.label}
                  >
                    <div className="relative aspect-[4/5] bg-[linear-gradient(180deg,#f7f2ff,#efe8fb)]">
                      <div className="absolute inset-4 rounded-[12px] border border-white/70 bg-white/70" />
                      {slide.accent ? (
                        <span className="absolute left-2 top-2 rounded-full bg-[#CB11AB] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          Титульник
                        </span>
                      ) : null}
                    </div>
                    <div className="border-t border-clay/70 bg-card/80 px-2 py-2 text-center text-[11px] font-bold text-ink">
                      {slide.label}
                    </div>
                  </div>
                ))}
                <div className="grid w-[108px] shrink-0 place-items-center gap-1 rounded-[16px] border border-dashed border-[#CB11AB]/40 bg-[#CB11AB]/5 px-2 py-3 text-center">
                  <Plus className="text-[#CB11AB]" size={20} />
                  <span className="text-[10px] font-black text-ink">Добавить</span>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] border border-clay bg-card/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-ink">Кроссовки женские оверсайз</p>
                    <p className="mt-1 text-xs text-muted">Категория WB · бренд · габариты · вес</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CB11AB]/12 px-3 py-1 text-xs font-black text-[#CB11AB]">
                    <CheckCircle2 size={14} />
                    4 фото
                  </span>
                </div>
                <div className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-button bg-[#CB11AB] text-sm font-semibold text-white">
                  Опубликовать на Wildberries
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
