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
    title: "Идея",
    text: "Название, жанры и завязка",
    icon: Sparkles
  },
  {
    num: "02",
    title: "Основа",
    text: "Синопсис, мир и план сюжета",
    icon: BookOpen
  },
  {
    num: "03",
    title: "Герои",
    text: "Персонажи и портреты",
    icon: Users
  },
  {
    num: "04",
    title: "Связи",
    text: "Карта отношений между героями",
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
    <section className="border-y border-white/10 bg-white/[0.02] py-10 sm:py-16" id="workflow">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Как работает ИИ-генератор историй</h2>
          <p className="mt-3 text-muted">
            От одной идеи до кабинета с персонажами, картой связей, главами и видео-сериями — без хаоса в заметках и чатах.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {steps.map((step, index) => (
            <Fragment key={step.num}>
              <div className="group flex flex-1 flex-col rounded-card border border-white/10 bg-card/60 p-5 backdrop-blur-sm transition hover:border-violet/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-violet/30 bg-violet/10 text-[11px] font-black text-violet">
                    {step.num}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition group-hover:text-violet">
                    <step.icon size={16} />
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>

              {index < steps.length - 1 ? (
                <div aria-hidden className="hidden shrink-0 items-center justify-center px-1 lg:flex lg:pt-8">
                  <ArrowRight className="text-violet/50" size={18} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
