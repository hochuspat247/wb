import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

const columns = [
  {
    title: "Фрилансер",
    items: ["1–3 дня ожидания", "Правки отдельно", "Цена за каждую карточку", "Сложно быстро тестировать"]
  },
  {
    title: "Ручная сборка",
    items: ["Нужно писать текст", "Искать ключи", "Делать дизайн", "Проверять форматы"]
  },
  {
    title: "MarketCard AI",
    items: [
      "Результат за минуты",
      "Текст + SEO + обложка",
      "Можно быстро сделать несколько вариантов",
      "Экспорт PNG и JSON"
    ],
    highlighted: true
  }
];

export function CompareSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          description="Многие карточки уже создаются с помощью AI-инструментов. MarketCard AI даёт продавцу такой инструмент напрямую — без ожидания, посредников и переплат."
          title="Дешевле фрилансера, быстрее ручной сборки"
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {columns.map((col, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={col.title}>
              <Card
                className={`h-full ${col.highlighted ? "border-ink bg-ink text-white" : ""}`}
                padding="lg"
              >
                <h3 className={`text-xl font-bold ${col.highlighted ? "text-white" : "text-ink"}`}>{col.title}</h3>
                <ul className="mt-6 space-y-3">
                  {col.items.map((item) => (
                    <li
                      className={`flex items-start gap-3 text-sm ${col.highlighted ? "text-white/75" : "text-muted"}`}
                      key={item}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          col.highlighted ? "bg-mint" : "bg-clay"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
