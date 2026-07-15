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
        <p className="story-fairy-eyebrow">Круг читателей и авторов</p>
        <h2 className="story-fairy-title mt-3 text-3xl text-moon sm:text-4xl">Кому подходит СториСтудио</h2>
        <p className="mt-3 text-muted">
          Для авторов, которым нужен не разовый ответ чата, а волшебная мастерская для длинной истории.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map(([title, scenario]) => (
          <div className="story-fairy-panel min-h-40 rounded-card p-6 transition hover:border-gold/40" key={title}>
            <p className="font-fairy text-xl font-semibold leading-tight text-moon">{title}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{scenario}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
