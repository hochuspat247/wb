import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    num: "1",
    title: "Фото товара",
    text: "Загрузите исходное фото или рендер товара."
  },
  {
    num: "2",
    title: "Текст и SEO",
    text: "Сервис подготовит название, описание, преимущества и ключевые слова."
  },
  {
    num: "3",
    title: "Обложка 4:5",
    text: "AI соберёт премиальную карточку для маркетплейса."
  },
  {
    num: "4",
    title: "Экспорт",
    text: "Скачайте PNG, JSON или скопируйте описание."
  },
  {
    num: "5",
    title: "История",
    text: "Сохраняйте варианты и возвращайтесь к ним позже."
  }
];

export function WorkflowSection() {
  return (
    <section className="py-20 md:py-28" id="workflow">
      <div className="section-shell">
        <SectionHeader
          description="От загрузки фото до готового файла — один сценарий без переключения между инструментами."
          title="Один рабочий поток вместо пяти разных инструментов"
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-5">
          {steps.map((step, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={step.num}>
              <div
                className={`workflow-connector relative flex h-full flex-col rounded-card border border-clay bg-card p-5 transition hover:border-ink/10 ${
                  i === steps.length - 1 ? "" : ""
                }`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-sm font-bold text-ink">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
