const items = [
  "Прямая публикация карточек в WB и Ozon.",
  "Брендбуки, шаблоны визуалов и пакетная генерация.",
  "Аналитика CTR, A/B тесты обложек и рекламные связки."
];

export function RoadmapSection() {
  return (
    <section className="py-20">
      <div className="section-shell">
        <div className="overflow-hidden rounded-[30px] border border-ink bg-ink p-8 text-white shadow-hard md:p-10">
          <span className="section-kicker">Roadmap</span>
          <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Что пойдет во вторую версию</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-5 font-bold leading-7" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
