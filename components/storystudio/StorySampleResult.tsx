"use client";

import Link from "next/link";
import { ArrowRight, GitBranch, Quote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STORY_SAMPLE_PROJECT } from "@/lib/storystudio/constants";

export function StorySampleResult() {
  const sample = STORY_SAMPLE_PROJECT;

  return (
    <section id="sample" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 text-center sm:mb-10">
        <p className="story-fairy-eyebrow">Пример результата</p>
        <h2 className="story-fairy-title mt-3 text-3xl text-moon sm:text-4xl">
          От одной идеи — к живому проекту
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          Не абстрактные обещания, а структура настоящего произведения: синопсис, герои, план, фрагмент главы и связи.
        </p>
      </div>

      <div className="story-fairy-panel space-y-8 rounded-container p-5 sm:p-8 lg:p-10">
        <div>
          <p className="story-fairy-eyebrow">Идея автора</p>
          <p className="mt-3 flex gap-3 text-base text-moon sm:text-lg">
            <Quote className="mt-1 h-5 w-5 shrink-0 text-gold" />
            {sample.premise}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="story-fairy-eyebrow">Синопсис</p>
            <h3 className="mt-2 font-fairy text-2xl font-semibold text-moon">{sample.title}</h3>
            <p className="mt-2 text-sm text-gold">{sample.hook}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{sample.synopsis}</p>
          </div>

          <div>
            <p className="story-fairy-eyebrow">Персонажи</p>
            <ul className="mt-3 space-y-3">
              {sample.characters.map((character) => (
                <li key={character.name} className="rounded-xl border border-[rgba(212,180,131,0.18)] bg-white/[0.03] p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-moon">{character.name}</span>
                    <span className="text-xs uppercase tracking-wide text-gold">{character.role}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{character.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="story-fairy-eyebrow">План на 10 глав</p>
            <ol className="mt-3 space-y-2">
              {sample.outline.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm text-muted">
                  <span className="w-6 shrink-0 font-medium text-gold">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="story-fairy-eyebrow">Фрагмент первой главы</p>
            <h4 className="mt-2 font-fairy text-xl text-moon">{sample.chapterTitle}</h4>
            <p className="mt-3 text-sm leading-relaxed text-muted">{sample.chapterExcerpt}</p>

            <p className="story-fairy-eyebrow mt-6">Карта отношений</p>
            <ul className="mt-3 space-y-2">
              {sample.relations.map((relation) => (
                <li key={`${relation.from}-${relation.to}`} className="flex items-center gap-2 text-sm text-muted">
                  <GitBranch className="h-3.5 w-3.5 text-mist" />
                  <span className="text-moon">{relation.from}</span>
                  <span>→</span>
                  <span className="text-moon">{relation.to}</span>
                  <span className="text-xs text-gold">({relation.label})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-[rgba(212,180,131,0.15)] pt-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted">
            Портреты и видео-сцены подключаются уже в кабинете — после того, как собрана текстовая основа.
          </p>
          <Link href="/storystudio/create">
            <Button className="!border-gold !bg-gold !text-[#1a140f]">
              Создать такой же проект
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
