"use client";

import { useState } from "react";
import { BookOpen, GitBranch, PenLine, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: Array<{
  num: string;
  title: string;
  text: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    num: "01",
    title: "Идея",
    text: "Название, жанры и завязка",
    detail: "Задайте зерно произведения — жанр, тон и зацепку. Дальше из этого вырастает весь мир.",
    icon: Sparkles
  },
  {
    num: "02",
    title: "Мир",
    text: "Синопсис, сеттинг и план",
    detail: "СториСтудио собирает сеттинг, правила мира и каркас сюжета — без пустого листа.",
    icon: BookOpen
  },
  {
    num: "03",
    title: "Герои",
    text: "Персонажи и портреты",
    detail: "Герои получают характеры, мотивации и визуальный образ, который можно взять в чтение.",
    icon: Users
  },
  {
    num: "04",
    title: "Связи",
    text: "Карта отношений",
    detail: "Враги, союзники, семья — отношения видны на карте, а не теряются в тексте.",
    icon: GitBranch
  },
  {
    num: "05",
    title: "Главы",
    text: "Пишите и продолжайте",
    detail: "Пишите сами или продолжайте главу с ИИ — история живёт в одном workspace.",
    icon: PenLine
  }
];

export function StoryStudioWorkflowSection() {
  const [active, setActive] = useState(0);
  const current = steps[active] ?? steps[0];

  return (
    <section className="story-workflow border-y border-[rgba(212,180,131,0.12)] py-12 sm:py-20" id="workflow">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <div>
            <p className="story-fairy-eyebrow">Как создаётся история</p>
            <h2 className="story-fairy-title mt-3 max-w-xl text-3xl text-moon sm:text-5xl sm:leading-[1.08]">
              Пять шагов
              <span className="block text-gold/90">одного пути</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Не чек-лист из карточек — непрерывная линия от идеи до живого текста.
            </p>
          </div>

          <div className="story-workflow-stage relative overflow-hidden rounded-[1.75rem] border border-[rgba(212,180,131,0.28)] px-6 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-6 -top-10 font-fairy text-[7.5rem] leading-none text-gold/[0.07] sm:text-[9rem]">
              {current.num}
            </div>
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/35 bg-gold/15 text-gold">
                  <current.icon size={18} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  Шаг {current.num}
                </p>
              </div>
              <h3 className="font-fairy text-3xl text-moon sm:text-4xl">{current.title}</h3>
              <p className="mt-2 text-sm text-gold/80">{current.text}</p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-[0.95rem]">
                {current.detail}
              </p>
              <div className="mt-7 h-px w-full bg-gradient-to-r from-gold/50 via-gold/15 to-transparent" />
              <p className="mt-3 text-xs text-muted">
                {active + 1} / {steps.length}
              </p>
            </div>
          </div>
        </div>

        <div className="story-workflow-rail mt-10 sm:mt-12">
          <div className="story-workflow-rail-line" aria-hidden />
          <div className="grid gap-2 sm:grid-cols-5 sm:gap-0">
            {steps.map((step, index) => {
              const isActive = index === active;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  aria-pressed={isActive}
                  className={`story-workflow-step group relative text-left ${isActive ? "is-active" : ""}`}
                >
                  <span className="story-workflow-dot" aria-hidden />
                  <span className="mt-4 block font-fairy text-2xl text-moon/35 transition group-hover:text-moon/70 sm:text-3xl">
                    <span className={isActive ? "text-gold" : ""}>{step.num}</span>
                  </span>
                  <span
                    className={`mt-1 block text-sm font-semibold tracking-wide ${
                      isActive ? "text-moon" : "text-muted"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted opacity-80 sm:pr-3">
                    {step.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
