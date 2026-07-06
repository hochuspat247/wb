import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
        <div className="studio-noise relative overflow-hidden rounded-container border border-clay bg-card p-8 text-white shadow-soft md:p-12">
          <SectionHeader
            align="left"
            description="Следующие шаги — превратить генератор в полноценное рабочее место селлера."
            theme="dark"
            title="Дальше — рабочее место селлера"
          />

          <div className="relative z-10 mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={item}>
                <div className="min-h-28 rounded-[18px] border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-xs font-black text-mint">0{i + 1}</p>
                  <p className="mt-4 text-sm font-bold leading-relaxed text-white/85">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
