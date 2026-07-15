import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PricingCard } from "@/components/ui/PricingCard";
import { getVideoRateRubPerSecond } from "@/config/video-pricing";
import {
  FREE_DEMO_CARDS,
  KIT_SERIES_DESCRIPTION,
  PLAN_CATALOG_NAME,
  PLAN_FREE_NAME,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_PRICE_RUB,
  SKU_KIT_SLIDE_COUNT,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  catalogBuyCta,
  describeFreeQuotaMarketing,
  describeMonthlyFreeReset,
  formatRub,
  formatVideoPriceRub,
  getVideoMarketingPrices,
  kitBuyCta
} from "@/lib/pricing";
import { BRAND } from "@/lib/branding";

const catalogPack = calculatePackagePrice(20);
const videoPrices = getVideoMarketingPrices("standard");
const videoProPrices = getVideoMarketingPrices("pro");

const plans = [
  {
    name: PLAN_FREE_NAME,
    subtitle: "Попробовать сервис",
    price: "0 ₽",
    unit: "один раз",
    features: [
      `${FREE_DEMO_CARDS} демо с водяным знаком без регистрации`,
      describeFreeQuotaMarketing(),
      describeMonthlyFreeReset(),
      "Только одиночные карточки — без серии",
      `${KIT_SERIES_DESCRIPTION} — в платном комплекте`,
      "Тексты и СЕО",
      "ИИ-обложка 4:5"
    ],
    cta: "Попробовать",
    href: "/register",
    metrikaPlan: "start"
  },
  {
    name: PLAN_SKU_KIT_NAME,
    subtitle: formatRub(SKU_KIT_PRICE_RUB),
    price: formatRub(SKU_KIT_PRICE_RUB),
    unit: "разовая оплата",
    billingNote: "Без подписки",
    features: [
      KIT_SERIES_DESCRIPTION,
      "Скачивание без водяного знака",
      "Разовая оплата, без подписки",
      "Тексты и СЕО для маркетплейса",
      "Публикация на Wildberries из истории",
      `Видео из карточки — отдельно, от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}`
    ],
    cta: kitBuyCta(),
    href: "/register",
    metrikaPlan: "seller",
    packageCount: SKU_KIT_SLIDE_COUNT,
    highlighted: true,
    badge: "Для одного товара"
  },
  {
    name: PLAN_CATALOG_NAME,
    subtitle: "До 4 комплектов для разных товаров",
    price: formatRub(catalogPack.total),
    unit: "20 слайдов",
    billingNote:
      catalogPack.savingsPercent > 0
        ? `${formatRub(catalogPack.pricePerUnit)} за слайд · −${catalogPack.savingsPercent}% к поштучной`
        : `${formatRub(catalogPack.pricePerUnit)} за слайд`,
    features: [
      "20 слайдов — до 4 комплектов по 5 для разных товаров",
      "Скачивание без водяного знака",
      "Публикация на Wildberries из истории",
      `Всё из тарифа «${PLAN_SKU_KIT_NAME}»`,
      "История и повторное создание карточек",
      "Приоритетная очередь",
      "Персональная поддержка в Telegram"
    ],
    cta: catalogBuyCta(),
    href: "/register",
    metrikaPlan: "pro",
    packageCount: 20
  }
];

export function PricingSection() {
  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28" id="pricing">
      <div className="section-shell">
        <SectionHeader
          description={`${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}. ${KIT_SERIES_DESCRIPTION} — в комплекте за ${formatRub(SKU_KIT_PRICE_RUB)} без водяного знака.`}
          title="Тарифы: комплект для одного товара"
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={plan.name}>
              <PricingCard {...plan} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <div className="mt-10 rounded-[24px] border border-clay bg-card p-6 md:p-8" id="video-pricing">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
              {BRAND.googleVeo} {BRAND.veoVersion} Фаст
            </p>
            <h3 className="mt-3 text-2xl font-black text-ink">Видео из готовой карточки</h3>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-muted">
              После создания комплекта в кабинете можно оживить обложку в короткий ролик. Видео оплачивается отдельно и не
              входит в комплект для SKU.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {videoPrices.map((item) => (
                <div className="rounded-[18px] border border-clay bg-paper/40 px-4 py-4" key={item.duration}>
                  <p className="text-sm font-semibold text-muted">{item.duration} сек · standard</p>
                  <p className="mt-1 text-2xl font-black text-ink">{formatVideoPriceRub(item.priceRub)}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm font-semibold text-muted">
              Pro-режим (4K): от {formatVideoPriceRub(videoProPrices[0].priceRub)} за 4 сек и далее по{" "}
              {formatRub(getVideoRateRubPerSecond("pro"))}/сек. Минимальная длительность — 4 секунды.{" "}
              <a className="text-accent underline-offset-2 hover:underline" href="/#video-example">
                Посмотреть пример ролика
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
