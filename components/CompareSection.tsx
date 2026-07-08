import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  FREE_TRIAL_CARDS,
  VIDEO_GENERATION_START_PRICE_RUB,
  formatRub,
  formatVideoPriceRub
} from "@/lib/pricing";

const rows = [
  ["Время на 1 карточку", "2–6 часов", "1–3 дня", "15–30 мин", "~2 минуты"],
  [
    "Стоимость карточки",
    "внутренний ресурс",
    "от 1 500 ₽",
    "от 990 ₽ за пакет",
    `${FREE_TOTAL_MARKETING_CARDS} бесплатно, далее ${formatRub(CARD_GENERATION_PRICE_RUB)}/фото`
  ],
  [
    "Видео из карточки",
    "—",
    "отдельный заказ",
    "—",
    `от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}, без звука`
  ],
  ["SEO и тексты", "вручную", "частично", "шаблоны", "автоматически"],
  ["Обложка 4:5", "дизайнер/Canva", "дизайнер", "шаблоны", "AI + пресеты WB/Ozon"],
  ["Масштаб SKU", "сложно", "дорого", "ограничено", "пакеты до 100+"],
  ["Экспорт", "собирать отдельно", "по договорённости", "PNG", "PNG + JSON"],
  ["Правки и версии", "каждый раз вручную", "оплата за версию", "ограничено", "новая версия сразу"],
  ["Поддержка маркетплейсов", "универсально", "зависит от исполнителя", "универсально", "WB, Ozon, Avito"]
];

const columns = ["", "Ручная сборка", "Фрилансер", "Canva / шаблоны", "MarketCard AI"];
const alternatives = columns.slice(1);

function CompareMobileCards({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={`space-y-3 md:hidden ${embedded ? "mt-6" : "mt-10"}`}>
      {rows.map((row) => {
        const [metric, ...values] = row;

        return (
          <article className="overflow-hidden rounded-container border border-clay bg-card" key={metric}>
            <h3 className="border-b border-clay px-4 py-3 text-sm font-black text-ink">{metric}</h3>

            <dl className="divide-y divide-clay">
              {alternatives.map((label, index) => {
                const isOurs = index === alternatives.length - 1;

                return (
                  <div
                    className={`flex items-start justify-between gap-4 px-4 py-3 ${isOurs ? "bg-accent/10" : ""}`}
                    key={label}
                  >
                    <dt className={`shrink-0 text-xs font-bold ${isOurs ? "text-accent" : "text-muted"}`}>{label}</dt>
                    <dd className={`text-right text-sm font-semibold ${isOurs ? "text-mint" : "text-muted"}`}>
                      {values[index]}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function CompareDesktopTable({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={`hidden overflow-x-auto rounded-container border border-clay bg-card md:block ${embedded ? "mt-8" : "mt-14"}`}>
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.05fr] border-b border-clay text-sm font-black text-ink">
          {columns.map((head, index) => (
            <div className={`p-4 md:p-5 ${index === 4 ? "bg-accent text-paper" : ""}`} key={head || "metric"}>
              {head}
            </div>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div
            className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.05fr] border-b border-clay last:border-b-0"
            key={row[0]}
          >
            {row.map((cell, index) => (
              <div
                className={`min-h-16 p-4 text-sm font-semibold md:p-5 ${
                  index === 0 ? "text-ink" : index === 4 ? "bg-white/[0.055] text-ink" : "text-muted"
                }`}
                key={`${rowIndex}-${index}`}
              >
                {index === 4 ? <span className="text-mint">{cell}</span> : cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompareSection({ embedded = false }: { embedded?: boolean }) {
  return (
    <section className={embedded ? "py-8 md:py-12" : "py-20 md:py-28"} id="compare">
      <div className={embedded ? "px-3 sm:px-5" : "section-shell"}>
        <SectionHeader
          description="Сравнение по скорости, стоимости и функционалу — почему продавцам выгоднее генерировать карточки в MarketCard AI."
          title="Наши преимущества относительно альтернатив"
        />

        <Reveal delay={1}>
          <CompareMobileCards embedded={embedded} />
          <CompareDesktopTable embedded={embedded} />
        </Reveal>
      </div>
    </section>
  );
}
