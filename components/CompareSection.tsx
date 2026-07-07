import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const rows = [
  ["Время на 1 карточку", "2–6 часов", "1–3 дня", "15–30 мин", "~2 минуты"],
  ["Стоимость", "внутренний ресурс", "от 1 500 ₽", "от 990 ₽ за пакет", "от 0 ₽"],
  ["SEO и тексты", "вручную", "частично", "шаблоны", "автоматически"],
  ["Обложка 4:5", "дизайнер/Canva", "дизайнер", "шаблоны", "AI + пресеты WB/Ozon"],
  ["Масштаб SKU", "сложно", "дорого", "ограничено", "пакеты до 100+"],
  ["Экспорт", "собирать отдельно", "по договорённости", "PNG", "PNG + JSON"],
  ["Правки и версии", "каждый раз вручную", "оплата за версию", "ограничено", "новая версия сразу"],
  ["Поддержка маркетплейсов", "универсально", "зависит от исполнителя", "универсально", "WB, Ozon, Avito"]
];

const columns = ["", "Ручная сборка", "Фрилансер", "Canva / шаблоны", "MarketCard AI"];

export function CompareSection() {
  return (
    <section className="py-20 md:py-28" id="compare">
      <div className="section-shell">
        <SectionHeader
          description="Сравнение по скорости, стоимости и функционалу — почему продавцам выгоднее генерировать карточки в MarketCard AI."
          title="Наши преимущества относительно альтернатив"
        />

        <Reveal delay={1}>
          <div className="mt-14 overflow-x-auto rounded-container border border-clay bg-card">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.05fr] border-b border-clay text-sm font-black text-ink">
                {columns.map((head, index) => (
                  <div className={`p-4 md:p-5 ${index === 4 ? "bg-accent text-paper" : ""}`} key={head || "metric"}>
                    {head}
                  </div>
                ))}
              </div>
              {rows.map((row) => (
                <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.05fr] border-b border-clay last:border-b-0" key={row[0]}>
                  {row.map((cell, index) => (
                    <div
                      className={`min-h-16 p-4 text-sm font-semibold md:p-5 ${
                        index === 0 ? "text-ink" : index === 4 ? "bg-white/[0.055] text-ink" : "text-muted"
                      }`}
                      key={`${row[0]}-${cell}`}
                    >
                      {index === 4 ? <span className="text-mint">{cell}</span> : cell}
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
