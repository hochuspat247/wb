import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
const audiences = [
  ["Селлеры WB/Ozon", "быстро запускать новые SKU"],
  ["Менеджеры маркетплейсов", "держать единый стандарт карточек"],
  ["Малые бренды", "выглядеть дороже без студии"],
  ["Агентства карточек", "ускорять черновики и варианты"],
  ["Производители", "готовить листинги для партнёров"],
  ["Стартап-команды", "проверять товарные гипотезы"]
];

export function AudienceSection() {
  return (
    <section className="border-t border-clay bg-card py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          description="Для команд, где карточка товара — рабочий актив, а не разовый красивый макет."
          title="Кому нужен такой инструмент"
        />

        <div className="mt-14 grid gap-px overflow-hidden rounded-container border border-clay bg-clay sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map(([title, scenario], i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={title}>
              <div className="min-h-48 bg-card p-7 transition hover:bg-paper">
                <p className="text-2xl font-black leading-tight text-ink">{title}</p>
                <p className="mt-5 text-sm font-semibold leading-relaxed text-muted">{scenario}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
