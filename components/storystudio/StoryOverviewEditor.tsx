"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { StoryProject } from "@/types/storystudio";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateStoryProject } from "@/lib/api/storystudio";

type StoryOverviewEditorProps = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  onError: (message: string) => void;
};

function parseThemes(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOutline(value: string) {
  return value
    .split("\n")
    .map((item) => item.replace(/^\d+[\).\s-]+/, "").trim())
    .filter(Boolean);
}

export function StoryOverviewEditor({ story, onUpdate, onError }: StoryOverviewEditorProps) {
  const [title, setTitle] = useState(story.title);
  const [hook, setHook] = useState(story.hook);
  const [synopsis, setSynopsis] = useState(story.synopsis);
  const [themesInput, setThemesInput] = useState(story.themes.join(", "));
  const [setting, setSetting] = useState(story.world.setting);
  const [tone, setTone] = useState(story.world.tone);
  const [outlineText, setOutlineText] = useState(story.outline.join("\n"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(story.title);
    setHook(story.hook);
    setSynopsis(story.synopsis);
    setThemesInput(story.themes.join(", "));
    setSetting(story.world.setting);
    setTone(story.world.tone);
    setOutlineText(story.outline.join("\n"));
  }, [story]);

  const hasChanges = useMemo(() => {
    const themes = parseThemes(themesInput);
    const outline = parseOutline(outlineText);

    return (
      title.trim() !== story.title ||
      hook.trim() !== story.hook ||
      synopsis.trim() !== story.synopsis ||
      setting.trim() !== story.world.setting ||
      tone.trim() !== story.world.tone ||
      themes.join("|") !== story.themes.join("|") ||
      outline.join("|") !== story.outline.join("|")
    );
  }, [title, hook, synopsis, themesInput, setting, tone, outlineText, story]);

  async function handleSave() {
    setSaving(true);
    onError("");

    try {
      const updated: StoryProject = {
        ...story,
        title: title.trim() || story.title,
        hook: hook.trim(),
        synopsis: synopsis.trim(),
        themes: parseThemes(themesInput),
        world: {
          ...story.world,
          setting: setting.trim(),
          tone: tone.trim()
        },
        outline: parseOutline(outlineText),
        needsAiRefresh: true,
        updatedAt: new Date().toISOString()
      };

      const saved = await updateStoryProject(updated);
      onUpdate(saved);
    } catch {
      onError("Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Редактируйте основу истории вручную — изменения сохраняются в проект.</p>
        <Button
          type="button"
          size="sm"
          className="w-full !border-violet !bg-violet !text-white sm:w-auto"
          disabled={saving || !hasChanges}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Сохраняем..." : hasChanges ? "Сохранить" : "Сохранено"}
        </Button>
      </div>

      <div className="rounded-card border border-white/10 bg-card p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Название</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название истории" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Зацепка</label>
          <Input
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            placeholder="Короткая интригующая фраза"
            className="text-violet"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Синопсис</label>
          <Textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Краткое описание сюжета"
            rows={4}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Темы</label>
          <Input
            value={themesInput}
            onChange={(e) => setThemesInput(e.target.value)}
            placeholder="Дружба, приключение, самопознание — через запятую"
          />
          {parseThemes(themesInput).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {parseThemes(themesInput).map((theme) => (
                <span key={theme} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted">
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-white/10 bg-card p-5 space-y-4">
          <h3 className="font-semibold">Мир</h3>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Сеттинг</label>
            <Textarea
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="Где и в каком мире происходит история"
              rows={5}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Тон</label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Например: тёплый, сказочный, с лёгкой иронией"
            />
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-card p-5 space-y-3">
          <h3 className="font-semibold">План сюжета</h3>
          <p className="text-xs text-muted">Каждый пункт — с новой строки. Нумерация необязательна.</p>
          <Textarea
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder={"1. Завязка\n2. Поворот\n3. Кульминация\n4. Финал"}
            rows={10}
          />
        </div>
      </div>
    </div>
  );
}
