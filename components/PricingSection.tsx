import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PricingCard } from "@/components/ui/PricingCard";
import { PAYMENT_TELEGRAM_URL } from "@/lib/pricing";

const plans = [
  {
    name: "Старт",
    subtitle: "Попробовать сервис",
    price: "0 ₽",
    unit: "1 шт",
    features: ["1 генерация карточки", "Доступ к редактору шаблонов"],
    cta: "Попробовать",
    href: "/register"
  },
  {
    name: "Рост",
    price: "490 ₽",
    unit: "5 шт",
    billingNote: "в месяц",
    features: [
      "5 генераций карточек",
      "Доступ к редактору шаблонов",
      "Название, описание и SEO-ключи",
      "AI-обложка 4:5 для маркетплейса",
      "Экспорт PNG и JSON",
      "История всех генераций",
      "Пресеты для WB, Ozon и Avito",
      "Приоритетная поддержка"
    ],
    cta: "Подключить",
    href: PAYMENT_TELEGRAM_URL,
    highlighted: true,
    badge: "Самый популярный"
  },
  {
    name: "Масштаб",
    subtitle: "Для активных селлеров",
    price: "1 490 ₽",
    unit: "20 шт",
    billingNote: "в месяц",
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
    href: PAYMENT_TELEGRAM_URL
  }
];

export function PricingSection() {
  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28" id="pricing">
      <div className="section-shell">
        <SectionHeader
          description="Первая карточка — без карты. Масштабируйтесь, когда убедитесь в результате."
          title="Начните бесплатно, масштабируйте после проверки"
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={plan.name}>
              <PricingCard {...plan} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
