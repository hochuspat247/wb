import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const plans = [
  {
    name: "Старт",
    price: "0 ₽",
    period: "навсегда",
    description: "Попробуйте и оцените результат",
    features: ["3 карточки в месяц", "Тексты и SEO", "HTML-обложка", "Скачивание PNG"],
    cta: "Начать бесплатно",
    highlighted: false
  },
  {
    name: "Продавец",
    price: "990 ₽",
    period: "в месяц",
    description: "Для активных продавцов на маркетплейсах",
    features: ["Безлимит карточек", "AI-обложки", "Все стили", "Приоритетная генерация", "История в кабинете"],
    cta: "Выбрать тариф",
    highlighted: true
  },
  {
    name: "Команда",
    price: "от 4 990 ₽",
    period: "в месяц",
    description: "Для агентств и брендов",
    features: ["Всё из «Продавец»", "Командный доступ", "Бренд-стили", "Персональный менеджер"],
    cta: "Связаться с нами",
    highlighted: false
  }
];

export function PricingSection() {
  return (
    <section className="relative py-24" id="pricing">
      <div className="absolute inset-0 bg-gradient-to-b from-paper via-white to-paper" />
      <div className="section-shell relative z-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-kicker">Тарифы</span>
            <h2 className="mt-5 text-3xl font-black leading-tight text-ink md:text-5xl">
              Начните бесплатно — <span className="gradient-text">растите с нами</span>
            </h2>
            <p className="mt-4 text-muted">Первые карточки бесплатно. Без привязки карты.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={plan.name}>
              <div
                className={`relative flex h-full flex-col rounded-3xl p-7 transition duration-500 ${
                  plan.highlighted
                    ? "scale-[1.02] border-2 border-violet/30 bg-ink text-white shadow-glow-violet"
                    : "premium-card"
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-coral to-violet px-5 py-1.5 text-xs font-black text-white shadow-glow">
                    Популярный
                  </span>
                ) : null}
                <h3 className="text-xl font-black">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/60" : "text-muted"}`}>{plan.description}</p>
                <div className="mt-6">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className={`ml-2 text-sm ${plan.highlighted ? "text-white/50" : "text-muted"}`}>/{plan.period}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li className="flex items-start gap-3 text-sm font-medium" key={feature}>
                      <Check className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-mint" : "text-coral"}`} size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link className="mt-8 block" href="/cabinet#create">
                  <Button className="w-full" variant={plan.highlighted ? "primary" : "secondary"}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
