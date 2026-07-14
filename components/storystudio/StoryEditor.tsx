"use client";

import { useEffect, useState } from "react";
import type { StoryChapter, StoryProject } from "@/types/storystudio";
import { BookOpen, ChevronDown, ChevronUp, Loader2, Plus, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { updateStoryProject } from "@/lib/api/storystudio";

type StoryEditorProps = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  onGenerateChapter: (instructions?: string) => Promise<void>;
  chapterLoading: boolean;
};

export function StoryEditor({ story, onUpdate, onGenerateChapter, chapterLoading }: StoryEditorProps) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(story.chapters[0]?.id ?? null);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [editContent, setEditContent] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!story.chapters.length) {
      setActiveChapterId(null);
      return;
    }
    if (!activeChapterId || !story.chapters.some((c) => c.id === activeChapterId)) {
      setActiveChapterId(story.chapters[story.chapters.length - 1]?.id ?? null);
    }
  }, [story.chapters, activeChapterId]);

  const activeChapter = story.chapters.find((c) => c.id === activeChapterId) ?? story.chapters[0];
  const showContinueCta = story.chapters.length > 0;

  function getChapterContent(chapter: StoryChapter) {
    return editContent[chapter.id] ?? chapter.content;
  }

  async function handleSaveChapter(chapter: StoryChapter) {
    setSaving(true);
    try {
      const content = getChapterContent(chapter);
      const updated: StoryProject = {
        ...story,
        chapters: story.chapters.map((c) =>
          c.id === chapter.id
            ? {
                ...c,
                content,
                wordCount: content.trim().split(/\s+/).filter(Boolean).length,
                updatedAt: new Date().toISOString()
              }
            : c
        ),
        updatedAt: new Date().toISOString()
      };
      const saved = await updateStoryProject(updated);
      onUpdate(saved);
      setEditContent((prev) => {
        const next = { ...prev };
        delete next[chapter.id];
        return next;
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {showContinueCta && (
        <div className="flex flex-col gap-3 rounded-card border border-violet/30 bg-violet/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Продолжить историю</p>
            <p className="mt-0.5 text-xs text-muted">
              {story.chapters.length === 1
                ? "Глава 1 готова — сгенерируйте следующую с ИИ или допишите вручную."
                : `Уже ${story.chapters.length} гл. — напишите следующую.`}
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0 !border-violet !bg-violet !text-white"
            disabled={chapterLoading}
            onClick={() => onGenerateChapter(instructions.trim() || undefined)}
          >
            {chapterLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Новая глава ИИ
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
        <aside className="rounded-card border border-white/10 bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink sm:mb-4">
            <BookOpen className="h-4 w-4 text-violet" />
            Главы ({story.chapters.length})
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {story.chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setActiveChapterId(chapter.id)}
                className={`w-[min(100%,220px)] shrink-0 rounded-xl px-3 py-2.5 text-left text-sm transition lg:w-full ${
                  activeChapter?.id === chapter.id
                    ? "bg-violet/20 text-ink"
                    : "text-muted hover:bg-white/5 hover:text-ink"
                }`}
              >
                <div className="font-medium">
                  {chapter.number}. {chapter.title}
                </div>
                <div className="text-xs opacity-70">{chapter.wordCount.toLocaleString("ru-RU")} слов</div>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Инструкции для следующей главы..."
              rows={3}
              className="text-sm"
            />
            <Button
              type="button"
              className="w-full !bg-violet !text-white !border-violet"
              disabled={chapterLoading}
              onClick={() => onGenerateChapter(instructions.trim() || undefined)}
            >
              {chapterLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Новая глава ИИ
            </Button>
          </div>
        </aside>

        <div className="rounded-card border border-white/10 bg-card p-4 sm:p-6">
          {activeChapter ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    Глава {activeChapter.number}: {activeChapter.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{activeChapter.summary}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => handleSaveChapter(activeChapter)}
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Сохраняем..." : "Сохранить"}
                </Button>
              </div>

              <Textarea
                value={getChapterContent(activeChapter)}
                onChange={(e) =>
                  setEditContent((prev) => ({ ...prev, [activeChapter.id]: e.target.value }))
                }
                rows={18}
                className="min-h-[280px] font-serif text-base leading-relaxed sm:min-h-[440px]"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  {getChapterContent(activeChapter).trim().split(/\s+/).filter(Boolean).length} слов
                </span>
                <span className="flex items-center gap-1">
                  {activeChapter.number > 1 && (
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-white/5"
                      onClick={() => {
                        const prev = story.chapters.find((c) => c.number === activeChapter.number - 1);
                        if (prev) setActiveChapterId(prev.id);
                      }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  {activeChapter.number < story.chapters.length && (
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-white/5"
                      onClick={() => {
                        const next = story.chapters.find((c) => c.number === activeChapter.number + 1);
                        if (next) setActiveChapterId(next.id);
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
              <p className="text-muted">Пока нет глав — сгенерируйте первую с ИИ</p>
              <Button
                type="button"
                className="!border-violet !bg-violet !text-white"
                disabled={chapterLoading}
                onClick={() => onGenerateChapter(instructions.trim() || undefined)}
              >
                {chapterLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Написать главу 1
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
