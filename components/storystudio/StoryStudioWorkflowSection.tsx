import { ArrowRight, BookOpen, GitBranch, PenLine, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

const steps: Array<{
  num: string;
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    num: "01",
    title: "Искра",
    text: "Название, жанры и завязка сказки",
    icon: Sparkles
  },
  {
    num: "02",
    title: "Мир",
    text: "Синопсис, сеттинг и план сюжета",
    icon: BookOpen
  },
  {
    num: "03",
    title: "Герои",
    text: "Персонажи и волшебные портреты",
    icon: Users
  },
  {
    num: "04",
    title: "Судьбы",
    text: "Карта связей между героями",
    icon: GitBranch
  },
  {
    num: "05",
    title: "Главы",
    text: "Пишите и продолжайте с ИИ",
    icon: PenLine
  }
];

export function StoryStudioWorkflowSection() {
  return (
    <section className="border-y border-[rgba(212,180,131,0.12)] bg-white/[0.015] py-10 sm:py-16" id="workflow">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="story-fairy-eyebrow">Как рождается сказка</p>
          <h2 className="story-fairy-title mt-3 text-3xl text-moon sm:text-4xl">От искры идеи до живой истории</h2>
          <p className="mt-3 text-muted">
            Пять шагов — будто листать волшебную книгу: мир, герои, связи и главы собираются сами собой.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {steps.map((step, index) => (
            <Fragment key={step.num}>
              <div className="story-fairy-panel group flex flex-1 flex-col rounded-card p-5 transition hover:border-gold/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/10 text-[11px] font-bold text-gold">
                    {step.num}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition group-hover:text-gold">
                    <step.icon size={16} />
                  </span>
                </div>
                <h3 className="mt-5 font-fairy text-xl font-semibold text-moon">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>

              {index < steps.length - 1 ? (
                <div aria-hidden className="hidden shrink-0 items-center justify-center px-1 lg:flex lg:pt-8">
                  <ArrowRight className="text-gold/45" size={18} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
