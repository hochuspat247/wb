import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PricingCard } from "@/components/ui/PricingCard";

const plans = [
  {
    name: "Start",
    price: "0 ₽",
    period: "старт",
    features: [
      "3 тестовые карточки",
      "Генерация названия и описания",
      "SEO-ключи",
      "Базовая обложка 4:5",
      "Экспорт результата"
    ],
    cta: "Попробовать",
    href: "/register"
  },
  {
    name: "Seller",
    price: "990 ₽",
    period: "мес",
    features: [
      "100 карточек в месяц",
      "Всё из Start",
      "AI-обложки через подключённый провайдер",
      "История генераций",
      "Экспорт PNG и JSON",
      "Несколько дизайн-пресетов"
    ],
    cta: "Выбрать Seller",
    href: "/register",
    highlighted: true,
    badge: "Популярный"
  },
  {
    name: "Pro",
    price: "2 990 ₽",
    period: "мес",
    features: [
      "500 карточек в месяц",
      "Всё из Seller",
      "Командная работа",
      "Больше пресетов",
      "Приоритетные генерации",
      "Интеграции в roadmap"
    ],
    cta: "Выбрать Pro",
    href: "/register"
  }
];

export function PricingSection() {
  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28" id="pricing">
      <div className="section-shell">
        <SectionHeader
          description="Первые 3 карточки — без карты. Масштабируйтесь, когда убедитесь в результате."
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
