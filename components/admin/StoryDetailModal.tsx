"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatAccountEmail } from "@/lib/auth/email-utils";
import { STORY_GENRES } from "@/lib/storystudio/constants";
import { getRelationTypeLabel } from "@/lib/storystudio/relations";
import type { StoryCharacter, StoryGenre, StoryProject } from "@/types/storystudio";

export type AdminStoryDetail = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  payload: StoryProject & {
    characters: Array<StoryCharacter & { imageDataUrl?: string | null }>;
  };
};

function DetailField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{String(value)}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;

  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">{label}</h4>
      <p className="mt-2 whitespace-pre-wrap rounded-[14px] border border-clay bg-paper/40 p-4 text-sm leading-6 text-ink">
        {value}
      </p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">{label}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="rounded-full border border-clay bg-paper px-3 py-1 text-xs font-semibold text-ink" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatGenre(genre: StoryGenre) {
  return STORY_GENRES.find((item) => item.id === genre)?.label ?? genre;
}

function CharacterCard({ character }: { character: StoryCharacter & { imageDataUrl?: string | null } }) {
  const imageSrc = character.imageDataUrl ?? character.imageUrl ?? null;

  return (
    <article className="rounded-[18px] border border-clay bg-paper/40 p-4">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="mx-auto w-full max-w-[120px]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={character.name}
              className="aspect-[3/4] w-full rounded-[14px] border border-clay object-cover"
              src={imageSrc}
            />
          ) : (
            <div className="grid aspect-[3/4] w-full place-items-center rounded-[14px] border border-dashed border-clay bg-card text-xs font-semibold text-muted">
              Нет фото
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-lg font-black text-ink">{character.name}</p>
            <p className="text-sm font-semibold text-muted">{character.role}</p>
          </div>
          <DetailField label="Возраст" value={character.age} />
          <TextBlock label="Внешность" value={character.appearance} />
          <TextBlock label="Характер" value={character.personality} />
          <TextBlock label="Предыстория" value={character.backstory} />
          <TextBlock label="Мотивация" value={character.motivation} />
          <TextBlock label="Секреты" value={character.secrets} />
          <ListBlock label="Теги" items={character.tags} />
        </div>
      </div>
    </article>
  );
}

export function StoryDetailModal({
  detail,
  loading,
  onClose
}: {
  detail: AdminStoryDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!detail && !loading) return null;

  const story = detail?.payload;
  const charactersById = new Map((story?.characters ?? []).map((character) => [character.id, character.name]));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm md:items-center">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden p-0" padding="none">
        <div className="flex items-center justify-between gap-4 border-b border-clay px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">История пользователя</p>
            <h3 className="mt-1 truncate text-lg font-black text-ink">{story?.title || "Загрузка..."}</h3>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-paper" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <Loader label="Загружаем историю..." />
          </div>
        ) : story && detail ? (
          <div className="max-h-[calc(92vh-78px)] space-y-8 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailField label="Пользователь" value={detail.userName || "Без имени"} />
              <DetailField
                label="Email"
                value={detail.userEmail ? formatAccountEmail(detail.userEmail) : "Вход через соцсеть — email не указан"}
              />
              <DetailField label="Создана" value={new Date(detail.createdAt).toLocaleString("ru-RU")} />
              <DetailField label="Обновлена" value={new Date(detail.updatedAt).toLocaleString("ru-RU")} />
              <DetailField label="Статус" value={story.status} />
              <DetailField label="Язык" value={story.language === "ru" ? "Русский" : "English"} />
              <DetailField label="Цель по объёму" value={`${story.targetWordCount} слов`} />
              <DetailField label="Режим" value={story.premiumMode ? "Премиум 18+" : "Обычный"} />
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Что вводил пользователь</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailField label="Название" value={story.title} />
                <DetailField label="Жанры" value={story.genres.map(formatGenre).join(", ")} />
                <div className="sm:col-span-2">
                  <TextBlock label="Основная идея" value={story.premise} />
                </div>
                <div className="sm:col-span-2">
                  <TextBlock label="Подсказка по персонажам" value={story.charactersHint} />
                </div>
              </div>
            </div>

            <TextBlock label="Синопсис" value={story.synopsis} />
            <TextBlock label="Хук" value={story.hook} />
            <ListBlock label="Темы" items={story.themes} />
            <ListBlock label="План по главам" items={story.outline} />

            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Мир истории</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailField label="Сеттинг" value={story.world?.setting} />
                <DetailField label="Эпоха" value={story.world?.era} />
                <DetailField label="Тон" value={story.world?.tone} />
                <ListBlock label="Правила мира" items={story.world?.rules} />
                <ListBlock label="Локации" items={story.world?.locations} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">
                Персонажи ({story.characters.length})
              </h4>
              <div className="mt-3 grid gap-4">
                {story.characters.length ? (
                  story.characters.map((character) => <CharacterCard character={character} key={character.id} />)
                ) : (
                  <p className="text-sm text-muted">Персонажи не сгенерированы</p>
                )}
              </div>
            </div>

            {story.relations.length ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Связи персонажей</h4>
                <div className="mt-3 grid gap-2">
                  {story.relations.map((relation) => (
                    <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3 text-sm font-semibold text-ink" key={relation.id}>
                      {charactersById.get(relation.fromId) ?? "?"} → {charactersById.get(relation.toId) ?? "?"} ·{" "}
                      {getRelationTypeLabel(relation.type)}
                      {relation.label ? ` · ${relation.label}` : ""} · интенсивность {relation.intensity}/10
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {story.chapters.length ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Главы ({story.chapters.length})</h4>
                <div className="mt-3 grid gap-4">
                  {story.chapters.map((chapter) => (
                    <article className="rounded-[18px] border border-clay bg-paper/40 p-4" key={chapter.id}>
                      <p className="text-base font-black text-ink">
                        {chapter.number}. {chapter.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        {chapter.wordCount} слов · {new Date(chapter.updatedAt).toLocaleString("ru-RU")}
                      </p>
                      <TextBlock label="Краткое содержание" value={chapter.summary} />
                      <TextBlock label="Текст главы" value={chapter.content} />
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {story.episodes.length ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">
                  Видео-серии ({story.episodes.length})
                </h4>
                <div className="mt-3 grid gap-3">
                  {story.episodes.map((episode) => (
                    <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3" key={episode.id}>
                      <p className="font-bold text-ink">{episode.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        Персонаж: {charactersById.get(episode.characterId) ?? episode.characterId} · статус {episode.status}
                      </p>
                      <TextBlock label="Сцена" value={episode.sceneDescription} />
                      {episode.videoUrl ? (
                        <a className="mt-2 inline-flex text-sm font-bold text-accent hover:underline" href={episode.videoUrl} rel="noreferrer" target="_blank">
                          Открыть видео
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
