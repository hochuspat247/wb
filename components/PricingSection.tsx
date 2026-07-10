import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PricingCard } from "@/components/ui/PricingCard";
import { getVideoRateRubPerSecond } from "@/config/video-pricing";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  FREE_TRIAL_CARDS,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  formatRub,
  formatVideoPriceRub,
  getVideoMarketingPrices
} from "@/lib/pricing";
import { BRAND } from "@/lib/branding";

const growthPack = calculatePackagePrice(5);
const scalePack = calculatePackagePrice(20);
const videoPrices = getVideoMarketingPrices("standard");
const videoProPrices = getVideoMarketingPrices("pro");

const plans = [
  {
    name: "Старт",
    subtitle: "Попробовать сервис",
    price: "0 ₽",
    unit: `${FREE_TOTAL_MARKETING_CARDS} шт`,
    features: [
      "1 демо без входа",
      `${FREE_TRIAL_CARDS} карточки после регистрации`,
      "Без водяного знака — первая карточка",
      "Тексты и СЕО",
      "ИИ-обложка 4:5",
      "PNG и JSON экспорт",
      `Далее — ${formatRub(CARD_GENERATION_PRICE_RUB)} за 1 фото`
    ],
    cta: "Попробовать",
    href: "/register",
    metrikaPlan: "start"
  },
  {
    name: "Рост",
    price: formatRub(growthPack.total),
    unit: "5 шт",
    billingNote: `${formatRub(growthPack.pricePerUnit)} за карточку`,
    features: [
      "5 генераций карточек",
      "Доступ к редактору шаблонов",
      "Название, описание и СЕО-ключи",
      "ИИ-обложка 4:5 для маркетплейса",
      "Экспорт PNG и JSON",
      "История всех генераций",
      "Пресеты для ВБ, Озон и Авито",
      `Видео из карточки — отдельно, от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}`
    ],
    cta: "Подключить",
    href: "/register",
    metrikaPlan: "seller",
    packageCount: 5,
    highlighted: true,
    badge: "Самый популярный"
  },
  {
    name: "Масштаб",
    subtitle: "Для активных селлеров",
    price: formatRub(scalePack.total),
    unit: "20 шт",
    billingNote: `${formatRub(scalePack.pricePerUnit)} за карточку`,
    features: [
      "20 генераций карточек",
      "Всё из тарифа «Рост»",
      "Все дизайн-пресеты без ограничений",
      "Приоритетная очередь генерации",
      "Несколько вариантов обложки на SKU",
      "Расширенная история и быстрый повтор",
      "Ранний доступ к новым интеграциям",
      "Персональная поддержка в Telegram"
    ],
    cta: "Подключить",
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
          description={`Карточка — ${formatRub(CARD_GENERATION_PRICE_RUB)} за фото. Видео из готовой карточки — отдельная опция после генерации обложки.`}
          title="Начните бесплатно, масштабируйте после проверки"
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{BRAND.googleVeo} {BRAND.veoVersion} Фаст</p>
            <h3 className="mt-3 text-2xl font-black text-ink">Видео из карточки товара</h3>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-muted">
              После создания карточки в кабинете можно оживить её в короткий ролик: плавный зум, параллакс и мягкое
              движение без искажения текста и товара. Видео всегда без звука, оплачивается отдельно.
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
              {formatRub(getVideoRateRubPerSecond("pro"))}/сек. Минимальная длительность — 4 секунды (ограничение Veo
              3.1).{" "}
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
