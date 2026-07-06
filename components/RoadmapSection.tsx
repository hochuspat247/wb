import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

const items = [
  "Интеграция с Wildberries API",
  "Интеграция с Ozon Seller API",
  "Автозаполнение характеристик",
  "A/B-тестирование обложек",
  "Аналитика карточек",
  "Рекомендации по улучшению конверсии"
];

export function RoadmapSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="section-shell">
        <div className="rounded-container border border-ink bg-ink p-8 text-white md:p-12">
          <SectionHeader
            align="left"
            description="Следующие шаги — превратить генератор в полноценное рабочее место селлера."
            theme="dark"
            title="Дальше — не просто генератор, а рабочее место селлера"
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={item}>
                <Card className="border-white/10 bg-white/5 text-white" padding="md">
                  <p className="text-sm font-medium leading-relaxed text-white/85">{item}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
