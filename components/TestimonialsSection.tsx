import { Quote, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const marketplaces = ["Wildberries", "OZON", "Яндекс Маркет"] as const;

const testimonials = [
  {
    quote:
      "Раньше на одну карточку уходил вечер: фото, текст, инфографика. Сейчас загружаю снимок с телефона и за пару минут получаю вариант, который можно сразу тестировать в листинге.",
    name: "Анна К.",
    role: "селлер категории «Дом»",
    marketplace: "Wildberries" as const,
    rating: 5
  },
  {
    quote:
      "Нам важно держать единый стиль на десятках SKU. Сервис помогает быстро собирать черновики, а дизайнеру остаётся только финальная полировка — экономим часы каждую неделю.",
    name: "Игорь М.",
    role: "менеджер маркетплейса",
    marketplace: "OZON" as const,
    rating: 5
  },
  {
    quote:
      "Запускали новую линейку и нужно было быстро проверить, какие обложки лучше кликают. Сделали несколько версий карточек без отдельной фотосессии — гипотезы проверили за день.",
    name: "Елена С.",
    role: "бренд-менеджер",
    marketplace: "Яндекс Маркет" as const,
    rating: 5
  }
];

const marketplaceStyles: Record<(typeof marketplaces)[number], string> = {
  Wildberries: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200",
  OZON: "border-cyan/25 bg-cyan/10 text-cyan",
  "Яндекс Маркет": "border-amber-300/25 bg-amber-300/10 text-amber-200"
};

export function TestimonialsSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="testimonials">
      <div className="section-shell">
        <SectionHeader title="Что говорят наши пользователи" />

        <Reveal delay={1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {marketplaces.map((marketplace) => (
              <span
                className={`rounded-full border px-4 py-2 text-sm font-bold ${marketplaceStyles[marketplace]}`}
                key={marketplace}
              >
                {marketplace}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={item.name}>
              <Card className="flex h-full flex-col" hover padding="lg">
                <div className="flex items-start justify-between gap-4">
                  <Quote className="shrink-0 text-accent/80" size={28} />
                  <div aria-label={`Оценка ${item.rating} из 5`} className="flex gap-0.5">
                    {Array.from({ length: item.rating }).map((_, index) => (
                      <Star className="fill-accent text-accent" key={index} size={14} />
                    ))}
                  </div>
                </div>

                <p className="mt-5 flex-1 text-sm font-medium leading-relaxed text-muted md:text-base">
                  «{item.quote}»
                </p>

                <div className="mt-6 border-t border-clay pt-5">
                  <p className="font-black text-ink">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-muted">{item.role}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${marketplaceStyles[item.marketplace]}`}
                  >
                    {item.marketplace}
                  </span>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
