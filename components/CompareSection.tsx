import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
const rows = [
  ["Время", "2–6 часов", "1–3 дня", "около 2 минут"],
  ["Стоимость", "внутренний ресурс", "за каждую карточку", "от 0 ₽"],
  ["Правки", "каждый раз вручную", "через согласования", "новая версия сразу"],
  ["Масштабирование", "сложно на SKU", "растёт бюджет", "100+ карточек в месяц"],
  ["Экспорт", "собирать отдельно", "по договорённости", "PNG + JSON"],
  ["Тест гипотез", "медленно", "дорого", "быстро"]
];

export function CompareSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          description="Многие карточки уже создаются с помощью AI-инструментов. MarketCard AI даёт продавцу такой инструмент напрямую — без ожидания, посредников и переплат."
          title="Дешевле фрилансера, быстрее ручной сборки"
        />

        <Reveal delay={1}>
          <div className="mt-14 overflow-x-auto rounded-container border border-clay bg-card">
            <div className="min-w-[760px]">
            <div className="grid grid-cols-[1fr_1fr_1fr_1.08fr] border-b border-clay text-sm font-black text-ink">
              {["", "Ручная сборка", "Фрилансер", "MarketCard AI"].map((head, index) => (
                <div className={`p-4 md:p-5 ${index === 3 ? "bg-ink text-white" : ""}`} key={head || "metric"}>
                  {head}
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="grid grid-cols-[1fr_1fr_1fr_1.08fr] border-b border-clay last:border-b-0" key={row[0]}>
                {row.map((cell, index) => (
                  <div
                    className={`min-h-16 p-4 text-sm font-semibold md:p-5 ${
                      index === 0 ? "text-ink" : index === 3 ? "bg-ink text-white" : "text-muted"
                    }`}
                    key={cell}
                  >
                    {index === 3 ? <span className="text-mint">{cell}</span> : cell}
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
