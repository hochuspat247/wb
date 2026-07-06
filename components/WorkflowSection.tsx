import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    num: "01",
    title: "Фото",
    text: "Загрузка исходника"
  },
  {
    num: "02",
    title: "Описание",
    text: "Смысл и оффер"
  },
  {
    num: "03",
    title: "SEO",
    text: "Ключи и структура"
  },
  {
    num: "04",
    title: "Обложка",
    text: "Креатив 4:5"
  },
  {
    num: "05",
    title: "Экспорт",
    text: "PNG и JSON"
  }
];

export function WorkflowSection() {
  return (
    <section className="py-20 md:py-28" id="workflow">
      <div className="section-shell">
        <SectionHeader
          description="Фото → описание → SEO → обложка → экспорт. Вся логика собрана в один продуктовый сценарий."
          title="Процесс виден как pipeline, а не спрятан в форме"
        />

        <div className="mt-14 overflow-hidden rounded-container border border-clay bg-card p-4 md:p-6">
          <div className="grid gap-3 lg:grid-cols-5">
          {steps.map((step, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={step.num}>
              <div
                className={`workflow-connector relative flex h-full min-h-40 flex-col rounded-[18px] border border-clay bg-paper p-5 transition hover:border-ink/20 ${
                  i === steps.length - 1 ? "" : ""
                }`}
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-black text-paper">
                  {step.num}
                </div>
                <h3 className="text-lg font-black text-ink">{step.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{step.text}</p>
                <div className="mt-auto pt-6">
                  <div className="h-12 rounded-xl border border-clay bg-card" />
                </div>
              </div>
            </Reveal>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
