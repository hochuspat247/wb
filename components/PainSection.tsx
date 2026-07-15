import { Reveal } from "@/components/ui/Reveal";

const pains = [
  {
    num: "01",
    title: "Текст",
    text: "Название и описание требуют отдельной редакторской сборки."
  },
  {
    num: "02",
    title: "SEO",
    text: "Ключи и структура часто собираются отдельно от визуала."
  },
  {
    num: "03",
    title: "Дизайн",
    text: "Хороший креатив требует времени, вкуса и согласований."
  },
  {
    num: "04",
    title: "Форматы",
    text: "Обложка, PNG, JSON и история должны быть в одном процессе."
  }
];

export function PainSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <div className="sticky top-28">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-ink">Проблема</p>
            <h2 className="mt-5 text-balance text-4xl font-black leading-[1] text-ink md:text-6xl">
              Карточка товара — узкое место запуска
            </h2>
            <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-muted">
              Товар готов, но запуск застревает на тексте, СЕО, визуале и форматах площадок.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-3">
          {pains.map((pain, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={pain.num}>
              <div className="grid gap-4 rounded-[22px] border border-clay bg-card p-6 md:grid-cols-[80px_1fr] md:items-start">
                <span className="text-3xl font-black text-accent-ink">{pain.num}</span>
                <div>
                  <h3 className="text-xl font-black text-ink">{pain.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{pain.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
