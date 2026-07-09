"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Clapperboard,
  GitBranch,
  Grid3X3,
  Loader2,
  PenLine,
  Plus,
  Sparkles,
  UserPlus,
  Wallet
} from "lucide-react";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { CharacterGrid } from "@/components/storystudio/CharacterGrid";
import { RelationshipTree } from "@/components/storystudio/RelationshipTree";
import { StoryEditor } from "@/components/storystudio/StoryEditor";
import { StoryVideoSeries } from "@/components/storystudio/StoryVideoSeries";
import { StoryPaymentButton } from "@/components/storystudio/StoryPaymentButton";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  calculateStoryPackagePrice,
  formatStoryRub,
  STORY_PACKAGES,
  STORY_GENERATION_PRICE_RUB
} from "@/lib/storystudio/pricing";
import {
  fetchStoryProjects,
  generateCharacterPortrait,
  generateStoryChapter,
  generateStoryCharacter,
  regenerateStoryFoundation,
  updateStoryProject,
} from "@/lib/api/storystudio";
import { fetchUserQuota } from "@/lib/api/user";
import { isStoryFoundationEmpty } from "@/lib/storystudio/storyState";
import type { CharacterRelation, StoryCharacter, StoryProject } from "@/types/storystudio";

type Tab = "overview" | "characters" | "relations" | "editor" | "series" | "pricing";

export function StoryStudioCabinet() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [stories, setStories] = useState<StoryProject[]>([]);
  const [activeStory, setActiveStory] = useState<StoryProject | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{ remaining: number; credits: number } | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [portraitLoadingId, setPortraitLoadingId] = useState<string | null>(null);
  const [charHint, setCharHint] = useState("");
  const [error, setError] = useState("");
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [videoOrderId, setVideoOrderId] = useState<string | null>(searchParams.get("videoOrder"));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [storyList, quotaData] = await Promise.all([fetchStoryProjects(), fetchUserQuota()]);
      setStories(storyList);
      setQuota({ remaining: quotaData.remaining, credits: quotaData.credits });

      const storyId = searchParams.get("story");
      const picked = storyId ? storyList.find((s) => s.id === storyId) : storyList[0];
      if (picked) {
        setActiveStory({ ...picked, episodes: picked.episodes ?? [] });
        setSelectedCharacterId(picked.characters[0]?.id ?? null);
        if (searchParams.get("videoOrder")) {
          setTab("series");
        }
      }
    } catch {
      setError("Не удалось загрузить данные.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadData]);

  function handleStoryUpdate(story: StoryProject) {
    setActiveStory(story);
    setStories((prev) => prev.map((s) => (s.id === story.id ? story : s)));
  }

  async function handleRelationsUpdate(payload: {
    characters: StoryCharacter[];
    relations: CharacterRelation[];
  }) {
    if (!activeStory) return;

    const story: StoryProject = {
      ...activeStory,
      characters: payload.characters,
      relations: payload.relations,
      updatedAt: new Date().toISOString()
    };

    handleStoryUpdate(story);

    try {
      await updateStoryProject(story);
    } catch {
      setError("Не удалось сохранить карту связей.");
    }
  }

  async function handleGenerateCharacter() {
    if (!activeStory) return;
    setCharacterLoading(true);
    setError("");
    try {
      const { story, quota: q } = await generateStoryCharacter(activeStory.id, { hint: charHint.trim() || undefined });
      handleStoryUpdate(story);
      setQuota({ remaining: (q as { remaining: number }).remaining, credits: (q as { credits: number }).credits });
      setSelectedCharacterId(story.characters[story.characters.length - 1]?.id ?? null);
      setCharHint("");
      setTab("characters");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации персонажа");
    } finally {
      setCharacterLoading(false);
    }
  }

  async function handleGeneratePortrait(characterId: string) {
    if (!activeStory) return;
    setPortraitLoadingId(characterId);
    setError("");
    try {
      const { story, quota: q } = await generateCharacterPortrait(activeStory.id, characterId);
      handleStoryUpdate(story);
      setQuota({ remaining: (q as { remaining: number }).remaining, credits: (q as { credits: number }).credits });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации портрета");
    } finally {
      setPortraitLoadingId(null);
    }
  }

  async function handleRegenerateFoundation() {
    if (!activeStory) return;
    setRegenerateLoading(true);
    setError("");
    try {
      const { story, quota: q } = await regenerateStoryFoundation(activeStory.id);
      handleStoryUpdate(story);
      setQuota({ remaining: (q as { remaining: number }).remaining, credits: (q as { credits: number }).credits });
      setSelectedCharacterId(story.characters[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось перегенерировать историю");
    } finally {
      setRegenerateLoading(false);
    }
  }

  async function handleGenerateChapter(instructions?: string) {
    if (!activeStory) return;
    setChapterLoading(true);
    setError("");
    try {
      const { story, quota: q } = await generateStoryChapter(activeStory.id, { instructions });
      handleStoryUpdate(story);
      setQuota({ remaining: (q as { remaining: number }).remaining, credits: (q as { credits: number }).credits });
      setTab("editor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации главы");
    } finally {
      setChapterLoading(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#07050d]">
        <StoryStudioHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-24 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-violet" />
          <h1 className="text-2xl font-bold">Войдите в аккаунт</h1>
          <p className="mt-2 text-muted">Чтобы работать с историями и персонажами</p>
          <Link href="/register?callbackUrl=/storystudio/cabinet" className="mt-6">
            <Button className="!bg-violet !text-white !border-violet">Создать аккаунт</Button>
          </Link>
        </div>
        <StoryStudioFooter />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen; highlight?: boolean }[] = [
    { id: "overview", label: "Обзор", icon: BookOpen },
    { id: "series", label: "Видео-серии", icon: Clapperboard, highlight: true },
    { id: "characters", label: "Персонажи", icon: Grid3X3 },
    { id: "relations", label: "Связи", icon: GitBranch },
    { id: "editor", label: "Редактор", icon: PenLine },
    { id: "pricing", label: "Тарифы", icon: Wallet }
  ];

  return (
    <div className="min-h-screen bg-[#07050d]">
      <StoryStudioHeader />

      <div className="mx-auto max-w-content px-4 pb-16 pt-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Мои истории</h1>
            {quota && (
              <p className="text-sm text-muted">
                Осталось генераций: <span className="text-violet">{quota.remaining}</span> из {quota.credits}
              </p>
            )}
          </div>
          <Link href="/storystudio/create">
            <Button className="!bg-violet !text-white !border-violet">
              <Plus className="h-4 w-4" />
              Новая история
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet" />
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/15 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-violet" />
            <h2 className="text-xl font-semibold">Пока нет историй</h2>
            <p className="mt-2 text-muted">Создайте первую с помощью AI за 30 секунд</p>
            <Link href="/storystudio/create" className="mt-6 inline-block">
              <Button className="!bg-violet !text-white !border-violet">Создать историю</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-2">
              {stories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => {
                    setActiveStory(story);
                    setSelectedCharacterId(story.characters[0]?.id ?? null);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    activeStory?.id === story.id
                      ? "border-violet bg-violet/15"
                      : "border-white/10 bg-card hover:border-violet/30"
                  }`}
                >
                  <div className="font-medium text-ink">{story.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {story.characters.length} перс. · {story.chapters.length} гл.
                  </div>
                </button>
              ))}
            </aside>

            {activeStory && (
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition ${
                        tab === t.id
                          ? "bg-violet/20 text-ink"
                          : t.highlight
                            ? "border border-violet/30 text-violet hover:bg-violet/10"
                            : "text-muted hover:bg-white/5"
                      }`}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                      {t.highlight && tab !== t.id && (
                        <span className="rounded-full bg-violet/30 px-1.5 text-[10px]">NEW</span>
                      )}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {tab === "overview" && (
                  <div className="space-y-6">
                    {activeStory && isStoryFoundationEmpty(activeStory) && (
                      <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-5">
                        <p className="text-sm text-amber-100">
                          Контент истории не сгенерировался — AI не вернул данные. Нажмите кнопку ниже, чтобы
                          попробовать снова (бесплатно).
                        </p>
                        <Button
                          type="button"
                          className="mt-3 !bg-violet !text-white !border-violet"
                          disabled={regenerateLoading}
                          onClick={handleRegenerateFoundation}
                        >
                          {regenerateLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Генерируем...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Сгенерировать заново
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="rounded-card border border-white/10 bg-card p-6">
                      <h2 className="text-xl font-bold">{activeStory.title}</h2>
                      <p className="mt-1 text-sm text-violet">{activeStory.hook}</p>
                      <p className="mt-4 text-muted">{activeStory.synopsis}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeStory.themes.map((theme) => (
                          <span key={theme} className="rounded-full bg-white/5 px-2.5 py-1 text-xs">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-card border border-white/10 bg-card p-5">
                        <h3 className="font-semibold">Мир</h3>
                        <p className="mt-2 text-sm text-muted">{activeStory.world.setting}</p>
                        <p className="mt-1 text-xs text-muted">Тон: {activeStory.world.tone}</p>
                      </div>
                      <div className="rounded-card border border-white/10 bg-card p-5">
                        <h3 className="font-semibold">План сюжета</h3>
                        {activeStory.outline.length > 0 ? (
                          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
                            {activeStory.outline.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ol>
                        ) : (
                          <p className="mt-2 text-sm text-muted">План сюжета пока не сгенерирован.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "characters" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 rounded-card border border-white/10 bg-card p-4">
                      <Textarea
                        value={charHint}
                        onChange={(e) => setCharHint(e.target.value)}
                        placeholder="Подсказка для нового персонажа..."
                        rows={2}
                        className="min-w-[200px] flex-1"
                      />
                      <Button
                        type="button"
                        className="!bg-violet !text-white !border-violet self-end"
                        disabled={characterLoading}
                        onClick={handleGenerateCharacter}
                      >
                        {characterLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Новый персонаж
                      </Button>
                    </div>
                    <CharacterGrid
                      characters={activeStory.characters}
                      selectedId={selectedCharacterId}
                      onSelect={setSelectedCharacterId}
                      onGeneratePortrait={handleGeneratePortrait}
                      portraitLoadingId={portraitLoadingId}
                    />
                  </div>
                )}

                {tab === "relations" && (
                  <RelationshipTree
                    characters={activeStory.characters}
                    relations={activeStory.relations}
                    selectedId={selectedCharacterId}
                    onSelect={setSelectedCharacterId}
                    onUpdate={handleRelationsUpdate}
                  />
                )}

                {tab === "editor" && (
                  <StoryEditor
                    story={activeStory}
                    onUpdate={handleStoryUpdate}
                    onGenerateChapter={handleGenerateChapter}
                    chapterLoading={chapterLoading}
                  />
                )}

                {tab === "series" && (
                  <StoryVideoSeries
                    story={activeStory}
                    onUpdate={handleStoryUpdate}
                    initialVideoOrderId={videoOrderId}
                    onGeneratePortrait={handleGeneratePortrait}
                    portraitLoadingId={portraitLoadingId}
                    onOpenCharacters={() => setTab("characters")}
                  />
                )}

                {tab === "pricing" && (
                  <div id="pricing" className="space-y-6">
                    <div className="rounded-card border border-violet/30 bg-violet/10 p-5">
                      <p className="text-sm">
                        1 генерация = история, персонаж, глава или портрет ·{" "}
                        <strong>{formatStoryRub(STORY_GENERATION_PRICE_RUB)}</strong>
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {STORY_PACKAGES.map((pkg) => {
                        const price = calculateStoryPackagePrice(pkg.count);
                        return (
                          <div key={pkg.id} className="rounded-card border border-white/10 bg-card p-5">
                            <h4 className="font-semibold">{pkg.label}</h4>
                            <p className="text-2xl font-bold text-violet">{formatStoryRub(price.total)}</p>
                            <p className="text-xs text-muted">−{price.savingsPercent}%</p>
                            <StoryPaymentButton count={pkg.count} className="mt-4 w-full !bg-violet !text-white !border-violet">
                              Купить
                            </StoryPaymentButton>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <StoryStudioFooter />
    </div>
  );
}
