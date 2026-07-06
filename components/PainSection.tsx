import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

const pains = [
  {
    num: "01",
    title: "Долго писать описание",
    text: "Название, преимущества, ключи и адаптация под площадку отнимают часы на каждый SKU."
  },
  {
    num: "02",
    title: "Дорого заказывать дизайн",
    text: "Каждая новая карточка — отдельный бюджет, согласования и ожидание исполнителя."
  },
  {
    num: "03",
    title: "Сложно попасть в требования площадок",
    text: "Формат 4:5, инфографика, SEO и визуальные стандарты WB и Ozon нужно соблюдать вручную."
  },
  {
    num: "04",
    title: "Нельзя быстро тестировать гипотезы",
    text: "Пока готовится одна версия карточки, конкуренты уже тестируют другие обложки и тексты."
  }
];

export function PainSection() {
  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          align="left"
          description="Продавец быстро находит товар, но потом тратит часы на описание, ключи, дизайн, обложку и адаптацию под площадки."
          title="Запуск товара тормозится не из-за товара, а из-за карточки"
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((pain, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={pain.num}>
              <Card className="h-full" hover padding="lg">
                <span className="text-sm font-bold text-muted">{pain.num}</span>
                <h3 className="mt-4 text-lg font-bold text-ink">{pain.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{pain.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
