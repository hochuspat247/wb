"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Film, Loader2, Play, Sparkles } from "lucide-react";
import { StoryVideoConfigModal } from "@/components/storystudio/StoryVideoConfigModal";
import { VideoWaitingScreen } from "@/components/video/VideoWaitingScreen";
import { VideoReadyScreen } from "@/components/video/VideoReadyScreen";
import { Button } from "@/components/ui/Button";
import { fetchStoryProject, fetchVideoOrderStatus } from "@/lib/api/storystudio";
import { fetchVideoCredits } from "@/lib/api/video";
import type { StoryCharacter, StoryEpisode, StoryProject } from "@/types/storystudio";

type StoryVideoSeriesProps = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  initialVideoOrderId?: string | null;
  onGeneratePortrait?: (characterId: string) => void;
  portraitLoadingId?: string | null;
  onOpenCharacters?: () => void;
};

type Phase = "list" | "config" | "waiting" | "ready";

export function StoryVideoSeries({
  story,
  onUpdate,
  initialVideoOrderId,
  onGeneratePortrait,
  portraitLoadingId,
  onOpenCharacters
}: StoryVideoSeriesProps) {
  const [phase, setPhase] = useState<Phase>(initialVideoOrderId ? "waiting" : "list");
  const [orderId, setOrderId] = useState<string | null>(initialVideoOrderId || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<StoryCharacter | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>();
  const [videoCredits, setVideoCredits] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const portraitCountRef = useRef(0);

  const episodes = story.episodes ?? [];
  const charactersWithPortrait = story.characters.filter((c) => c.imageBase64 || c.imageUrl);
  const charactersWithoutPortrait = story.characters.filter((c) => !c.imageBase64 && !c.imageUrl);

  useEffect(() => {
    const prevCount = portraitCountRef.current;
    portraitCountRef.current = charactersWithPortrait.length;

    if (
      phase === "list" &&
      !portraitLoadingId &&
      charactersWithPortrait.length > prevCount &&
      charactersWithPortrait.length > 0
    ) {
      const character = charactersWithPortrait[charactersWithPortrait.length - 1];
      setSelectedCharacter(character);
      setSelectedChapterId(undefined);
      setPhase("config");
    }
  }, [charactersWithPortrait.length, phase, portraitLoadingId, charactersWithPortrait]);

  useEffect(() => {
    fetchVideoCredits().then(setVideoCredits).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (initialVideoOrderId) {
      setOrderId(initialVideoOrderId);
      setPhase("waiting");
    }
  }, [initialVideoOrderId]);

  async function refreshStory() {
    setRefreshing(true);
    try {
      const updated = await fetchStoryProject(story.id);
      onUpdate(updated);
    } finally {
      setRefreshing(false);
    }
  }

  function openConfig(character: StoryCharacter, chapterId?: string) {
    setSelectedCharacter(character);
    setSelectedChapterId(chapterId);
    setPhase("config");
  }

  if (phase === "waiting" && orderId) {
    return (
      <VideoWaitingScreen
        orderId={orderId}
        onDone={(url) => {
          setVideoUrl(url);
          setPhase("ready");
          void refreshStory();
        }}
        onError={() => {
          setPhase("list");
          void refreshStory();
        }}
      />
    );
  }

  if (phase === "ready" && videoUrl && orderId) {
    return (
      <VideoReadyScreen
        videoUrl={videoUrl}
        orderId={orderId}
        onBackToCard={() => {
          setPhase("list");
          setOrderId(null);
          setVideoUrl(null);
          void refreshStory();
        }}
        onCreateAnother={() => {
          setPhase("list");
          setOrderId(null);
          setVideoUrl(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-violet/30 bg-gradient-to-br from-violet/15 to-cyan/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-violet">
              <Sparkles className="h-4 w-4" />
              Только в StoryStudio
            </div>
            <h3 className="mt-1 text-lg font-bold text-ink">Видео-серии из вашей истории</h3>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Превратите портреты персонажей в кинематографичные сцены через Google Veo 3.1 — собирайте серии как
              эпизоды для Reels, Shorts и TikTok.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center">
            <Film className="mx-auto h-6 w-6 text-violet" />
            <p className="mt-1 text-2xl font-bold text-ink">{episodes.length}</p>
            <p className="text-xs text-muted">серий</p>
          </div>
        </div>
      </div>

      {charactersWithPortrait.length === 0 ? (
        <div className="rounded-card border border-dashed border-violet/30 bg-violet/5 p-6">
          {story.characters.length === 0 ? (
            <div className="text-center">
              <p className="text-sm text-muted">
                Добавьте персонажей в историю — без них видео-серию снять не получится.
              </p>
              {onOpenCharacters && (
                <Button
                  type="button"
                  className="mt-4 !bg-violet !text-white !border-violet"
                  onClick={onOpenCharacters}
                >
                  Перейти к персонажам
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-ink">Шаг 1: AI-портрет персонажа</h4>
                <p className="mt-1 text-sm text-muted">
                  Видео Veo 3.1 строится на портрете героя. Сгенерируйте его здесь — и сразу откроется съёмка серии.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {charactersWithoutPortrait.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card/80 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{character.name}</p>
                      <p className="truncate text-xs text-muted">{character.role}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 !bg-violet !text-white !border-violet"
                      disabled={!onGeneratePortrait || portraitLoadingId === character.id}
                      onClick={() => onGeneratePortrait?.(character.id)}
                    >
                      {portraitLoadingId === character.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Рисуем...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Портрет AI
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-card border border-white/10 bg-card p-5">
          <h4 className="mb-1 font-semibold text-ink">Снять новую серию</h4>
          <p className="mb-4 text-sm text-muted">Выберите персонажа — откроется настройка сцены и оплата через Veo 3.1.</p>
          <div className="flex flex-wrap gap-2">
            {charactersWithPortrait.map((character) => (
              <Button
                key={character.id}
                type="button"
                className="!bg-violet !text-white !border-violet"
                onClick={() => openConfig(character)}
              >
                <Clapperboard className="h-4 w-4" />
                Снять серию: {character.name}
              </Button>
            ))}
          </div>
          {story.chapters.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">По главе</p>
              <div className="flex flex-wrap gap-2">
                {story.chapters.map((chapter) => {
                  const char = charactersWithPortrait[0];
                  if (!char) return null;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => openConfig(char, chapter.id)}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted hover:border-violet/40 hover:text-ink"
                    >
                      Гл. {chapter.number}: {chapter.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-ink">Ваши серии</h4>
          {refreshing && <Loader2 className="h-4 w-4 animate-spin text-violet" />}
        </div>

        {episodes.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/15 p-6 text-center text-sm text-muted">
            Пока нет видео-серий. Снимите первую сцену — она появится здесь.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {episodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} story={story} onRefresh={refreshStory} />
            ))}
          </div>
        )}
      </div>

      {selectedCharacter && phase === "config" && (
        <StoryVideoConfigModal
          open
          story={story}
          character={selectedCharacter}
          chapter={story.chapters.find((c) => c.id === selectedChapterId)}
          videoCredits={videoCredits}
          onClose={() => {
            setPhase("list");
            setSelectedCharacter(null);
          }}
          onOrderCreated={(id, updatedStory) => {
            onUpdate(updatedStory);
            setOrderId(id);
            setPhase("waiting");
            setSelectedCharacter(null);
          }}
        />
      )}
    </div>
  );
}

function EpisodeCard({
  episode,
  story,
  onRefresh
}: {
  episode: StoryEpisode;
  story: StoryProject;
  onRefresh: () => void;
}) {
  const character = story.characters.find((c) => c.id === episode.characterId);
  const portrait = character?.imageBase64
    ? `data:${character.imageMimeType || "image/png"};base64,${character.imageBase64}`
    : character?.imageUrl;

  useEffect(() => {
    if (episode.status !== "processing" || !episode.videoOrderId) return;
    const timer = window.setInterval(async () => {
      try {
        const status = await fetchVideoOrderStatus(episode.videoOrderId!);
        if (status.status === "done" || status.status === "error") {
          onRefresh();
        }
      } catch {
        // ignore poll errors
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [episode.status, episode.videoOrderId, onRefresh]);

  return (
    <article className="overflow-hidden rounded-card border border-white/10 bg-card">
      <div className="relative aspect-video bg-sand">
        {episode.videoUrl ? (
          <video src={episode.videoUrl} className="h-full w-full object-cover" controls playsInline />
        ) : portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait} alt="" className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Film className="h-8 w-8" />
          </div>
        )}
        {episode.status === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-violet" />
          </div>
        )}
        {episode.videoUrl && (
          <a
            href={episode.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 rounded-full bg-violet p-2 text-white"
          >
            <Play className="h-4 w-4" />
          </a>
        )}
      </div>
      <div className="p-4">
        <h5 className="font-semibold text-ink">{episode.title}</h5>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{episode.sceneDescription}</p>
        <p className="mt-2 text-xs text-violet">
          {episode.status === "done" ? "Готово" : episode.status === "processing" ? "Снимаем..." : episode.status}
        </p>
      </div>
    </article>
  );
}
