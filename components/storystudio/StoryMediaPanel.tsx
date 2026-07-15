"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { generateStoryMedia, updateStoryProject } from "@/lib/api/storystudio";
import type { StoryMediaKind, StoryProject } from "@/types/storystudio";

type Props = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  onError: (message: string) => void;
  applyQuota: (quota: unknown) => void;
};

const KIND_OPTIONS: { id: StoryMediaKind; label: string; hint: string }[] = [
  { id: "character", label: "Персонаж", hint: "Портрет героя или настроение в сцене" },
  { id: "world", label: "Мир", hint: "Локации, атмосфера, города, комнаты" },
  { id: "chapter", label: "Глава", hint: "Ключевой момент или настроение сцены" },
  { id: "fact", label: "Факт мира", hint: "Объект, правило, место или деталь" }
];

function assetSrc(asset: NonNullable<StoryProject["media"]>[number]) {
  if (asset.imageBase64 && asset.imageMimeType) {
    return `data:${asset.imageMimeType};base64,${asset.imageBase64}`;
  }
  return asset.imageUrl || null;
}

export function StoryMediaPanel({ story, onUpdate, onError, applyQuota }: Props) {
  const [kind, setKind] = useState<StoryMediaKind>("character");
  const [entityId, setEntityId] = useState(story.characters[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [showInReader, setShowInReader] = useState(true);
  const [loading, setLoading] = useState(false);
  const media = story.media ?? [];

  const entityOptions = useMemo(() => {
    if (kind === "character") {
      return story.characters.map((c) => ({ id: c.id, label: c.name }));
    }
    if (kind === "chapter") {
      return story.chapters.map((c) => ({ id: c.id, label: `${c.number}. ${c.title}` }));
    }
    if (kind === "fact") {
      const facts = [
        ...story.world.locations.map((loc) => ({ id: `loc:${loc}`, label: loc })),
        ...story.world.rules.map((rule) => ({ id: `rule:${rule}`, label: rule }))
      ];
      return facts.length ? facts : [];
    }
    return [];
  }, [kind, story]);

  async function handleGenerate() {
    setLoading(true);
    onError("");
    try {
      const selected = entityOptions.find((o) => o.id === entityId);
      const { story: updated, quota } = await generateStoryMedia({
        storyId: story.id,
        kind,
        title: title.trim() || selected?.label || kind,
        prompt: prompt.trim() || undefined,
        entityId: entityId || undefined,
        showInReader
      });
      onUpdate(updated);
      applyQuota(quota);
      setPrompt("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Не удалось сгенерировать изображение");
    } finally {
      setLoading(false);
    }
  }

  async function toggleReader(assetId: string, next: boolean) {
    const nextMedia = media.map((asset) =>
      asset.id === assetId ? { ...asset, showInReader: next } : asset
    );
    const nextStory: StoryProject = {
      ...story,
      media: nextMedia,
      updatedAt: new Date().toISOString()
    };
    onUpdate(nextStory);
    try {
      await updateStoryProject(nextStory);
    } catch {
      onError("Не удалось обновить показ в чтении");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-white/10 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ImageIcon className="h-5 w-5 text-violet" />
          Медиа
        </h2>
        <p className="mt-1 text-sm text-muted">
          Генерируйте изображения для персонажей, мира, глав и фактов — и включайте их в режим чтения.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setKind(option.id);
                if (option.id === "character") setEntityId(story.characters[0]?.id ?? "");
                if (option.id === "chapter") setEntityId(story.chapters[0]?.id ?? "");
                if (option.id === "fact") setEntityId(entityOptions[0]?.id ?? "");
                if (option.id === "world") setEntityId("");
              }}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                kind === option.id
                  ? "border-violet bg-violet/20 text-ink"
                  : "border-white/10 text-muted hover:border-violet/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{KIND_OPTIONS.find((o) => o.id === kind)?.hint}</p>

        {entityOptions.length > 0 && (
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-muted">Сущность</span>
            <Select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              variant="dark"
              className="story-media-entity-select"
            >
              {entityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        )}

        <div className="mt-4 grid gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название изображения (необязательно)"
          />
          <Textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Например: туманное утро над разрушенной крепостью, комната героя после ссоры…"
          />
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showInReader}
            onChange={(e) => setShowInReader(e.target.checked)}
            className="rounded border-white/20"
          />
          Показывать в режиме чтения
        </label>

        <Button
          type="button"
          className="mt-4 !border-violet !bg-violet !text-white"
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Сгенерировать
        </Button>
      </div>

      {media.length === 0 ? (
        <div className="rounded-card border border-dashed border-white/15 p-8 text-center text-sm text-muted">
          Пока нет медиа. Создайте первое изображение сверху.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {media
            .slice()
            .reverse()
            .map((asset) => {
              const src = assetSrc(asset);
              return (
                <figure key={asset.id} className="overflow-hidden rounded-card border border-white/10 bg-card">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={asset.title} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-white/5 text-muted">
                      Нет превью
                    </div>
                  )}
                  <figcaption className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">{asset.title}</p>
                        <p className="text-xs uppercase tracking-wide text-muted">{asset.kind}</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={Boolean(asset.showInReader)}
                          onChange={(e) => toggleReader(asset.id, e.target.checked)}
                        />
                        В чтении
                      </label>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted">{asset.prompt}</p>
                  </figcaption>
                </figure>
              );
            })}
        </div>
      )}
    </div>
  );
}
