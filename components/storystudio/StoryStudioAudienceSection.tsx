const audiences: Array<[string, string]> = [
  ["Авторы романов", "собрать структуру и писать главы с ИИ"],
  ["Фанфик-писатели", "держать персонажей и пейринги в одном проекте"],
  ["Сценаристы", "прототипировать сцены и эпизоды"],
  ["Блогеры и креаторы", "снимать видео-серии из героев"],
  ["Начинающие писатели", "быстро получить основу истории"],
  ["Редакторы и кураторы", "готовить черновики для доработки"]
];

export function StoryStudioAudienceSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16" id="audience">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Кому подходит СториСтудио</h2>
        <p className="mt-3 text-muted">
          Для авторов, которым нужен не разовый ответ чата, а рабочая среда для длинной истории с персонажами и сюжетом.
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-container border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map(([title, scenario]) => (
          <div className="min-h-40 bg-[#0d0a18] p-6 transition hover:bg-violet/5" key={title}>
            <p className="text-xl font-bold leading-tight text-ink">{title}</p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted">{scenario}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
