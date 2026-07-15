"use client";

import { useEffect, useState } from "react";
import { Check, Circle, ImageIcon, PenLine, Sparkles, X } from "lucide-react";
import { isStoryFoundationEmpty } from "@/lib/storystudio/storyState";
import type { StoryProject } from "@/types/storystudio";

type Tab =
  | "overview"
  | "characters"
  | "relations"
  | "editor"
  | "series"
  | "read"
  | "analysis"
  | "media"
  | "pricing";

type StoryOnboardingChecklistProps = {
  story: StoryProject;
  onGoToTab: (tab: Tab) => void;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  tab: Tab;
  icon: typeof Sparkles;
};

function dismissKey(storyId: string) {
  return `storystudio_checklist_dismissed:${storyId}`;
}

export function StoryOnboardingChecklist({ story, onGoToTab }: StoryOnboardingChecklistProps) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(window.localStorage.getItem(dismissKey(story.id)) === "1");
  }, [story.id]);

  const hasPortrait = story.characters.some((c) => Boolean(c.imageUrl || c.imageBase64));
  const items: ChecklistItem[] = [
    {
      id: "foundation",
      label: "Основа истории",
      done: !isStoryFoundationEmpty(story),
      tab: "overview",
      icon: Sparkles
    },
    {
      id: "chapter1",
      label: "Глава 1",
      done: story.chapters.length >= 1,
      tab: "editor",
      icon: PenLine
    },
    {
      id: "chapter2",
      label: "Глава 2",
      done: story.chapters.length >= 2,
      tab: "editor",
      icon: PenLine
    },
    {
      id: "portrait",
      label: "Портрет персонажа",
      done: hasPortrait,
      tab: "characters",
      icon: ImageIcon
    }
  ];

  const doneCount = items.filter((item) => item.done).length;
  const allDone = doneCount === items.length;
  const nextItem = items.find((item) => !item.done);

  if (hidden || allDone) {
    return null;
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissKey(story.id), "1");
    setHidden(true);
  }

  return (
    <div className="mb-4 rounded-card border border-violet/30 bg-violet/10 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Следующие шаги</p>
          <p className="mt-0.5 text-xs text-muted">
            {doneCount} из {items.length} готово
            {nextItem ? ` · дальше: ${nextItem.label}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-ink"
          aria-label="Скрыть чеклист"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onGoToTab(item.tab)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              item.done
                ? "border-emerald-500/25 bg-emerald-500/10 text-ink"
                : "border-violet/40 bg-violet/15 text-ink hover:bg-violet/25"
            }`}
          >
            {item.done ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-violet" />
            )}
            <item.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className={item.done ? "text-ink/80" : "font-medium"}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
