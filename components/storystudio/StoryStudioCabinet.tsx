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
  ImageIcon,
  Loader2,
  PenLine,
  Plus,
  ScanSearch,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  Wallet
} from "lucide-react";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { CharacterGrid } from "@/components/storystudio/CharacterGrid";
import { RelationshipTree } from "@/components/storystudio/RelationshipTree";
import { StoryEditor } from "@/components/storystudio/StoryEditor";
import { StoryOverviewEditor } from "@/components/storystudio/StoryOverviewEditor";
import { StoryVideoSeries } from "@/components/storystudio/StoryVideoSeries";
import { StoryAiRefreshBanner } from "@/components/storystudio/StoryAiRefreshBanner";
import { StoryOnboardingChecklist } from "@/components/storystudio/StoryOnboardingChecklist";
import { StoryPaymentButton } from "@/components/storystudio/StoryPaymentButton";
import { StoryPremiumUpsellBanner } from "@/components/storystudio/StoryPremiumUpsellBanner";
import { StoryPricingCard } from "@/components/storystudio/StoryPricingCard";
import { StoryShareReadPanel } from "@/components/storystudio/StoryShareReadPanel";
import { StoryAnalysisPanel } from "@/components/storystudio/StoryAnalysisPanel";
import { StoryMediaPanel } from "@/components/storystudio/StoryMediaPanel";
import { PromoCodeForm } from "@/components/promo/PromoCodeForm";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import {
  calculateStoryPackagePrice,
  formatStoryRub,
  STORY_GENERATION_EXPLAINER,
  STORY_PACKAGES,
  STORY_GENERATION_PRICE_RUB
} from "@/lib/storystudio/pricing";
import {
  deleteStoryProject,
  fetchStoryProjects,
  generateCharacterPortrait,
  generateStoryChapter,
  generateStoryCharacter,
  migrateGuestStories,
  regenerateStoryFoundation,
  updateStoryProject
} from "@/lib/api/storystudio";
import { fetchUserQuota } from "@/lib/api/user";
import {
  STORY_GUEST_ID_KEY,
  STORY_INTENDED_STORY_KEY,
  buildStoryCabinetFromDemoUrl
} from "@/lib/guest";
import { isStoryFoundationEmpty } from "@/lib/storystudio/storyState";
import type { CharacterRelation, StoryCharacter, StoryProject } from "@/types/storystudio";

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

const VALID_TABS: Tab[] = [
  "overview",
  "characters",
  "relations",
  "editor",
  "series",
  "read",
  "analysis",
  "media",
  "pricing"
];

function parseTabParam(value: string | null): Tab | null {
  if (!value) return null;
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : null;
}

export function StoryStudioCabinet() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [stories, setStories] = useState<StoryProject[]>([]);
  const [activeStory, setActiveStory] = useState<StoryProject | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{
    remaining: number;
    credits: number;
    portraitFreeRemaining?: number;
    storyPremiumUnlocked?: boolean;
  } | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [portraitLoadingId, setPortraitLoadingId] = useState<string | null>(null);
  const [charHint, setCharHint] = useState("");
  const [error, setError] = useState("");
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [demoWelcomeStoryId, setDemoWelcomeStoryId] = useState<string | null>(searchParams.get("fromDemo"));
  const [videoOrderId] = useState<string | null>(searchParams.get("videoOrder"));
  const [registerCallbackUrl, setRegisterCallbackUrl] = useState("/storystudio/cabinet");

  useEffect(() => {
    const intendedStoryId = window.localStorage.getItem(STORY_INTENDED_STORY_KEY);
    setRegisterCallbackUrl(
      intendedStoryId ? buildStoryCabinetFromDemoUrl(intendedStoryId) : "/storystudio/cabinet"
    );
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fromDemoParam = searchParams.get("fromDemo");
      const fromDemoStored = window.localStorage.getItem(STORY_INTENDED_STORY_KEY);
      const fromDemoId = fromDemoParam || fromDemoStored || null;
      const storyId = searchParams.get("story") || fromDemoId;

      const guestId = window.localStorage.getItem(STORY_GUEST_ID_KEY);
      if (guestId) {
        try {
          await migrateGuestStories(guestId);
        } catch {
          // migration is best-effort
        }
      }

      const [storyList, accountQuota] = await Promise.all([fetchStoryProjects(), fetchUserQuota()]);
      setStories(storyList);
      const storyQuota = accountQuota.story;
      setQuota({
        remaining: storyQuota?.remaining ?? 0,
        credits: storyQuota?.credits ?? 0,
        portraitFreeRemaining: storyQuota?.portraitFreeRemaining,
        storyPremiumUnlocked: accountQuota.storyPremiumUnlocked
      });

      const picked = storyId
        ? storyList.find((s) => s.id === storyId) ?? (fromDemoId ? storyList[0] : undefined)
        : storyList[0];
      if (picked) {
        setActiveStory({ ...picked, episodes: picked.episodes ?? [], media: picked.media ?? [] });
        setSelectedCharacterId(picked.characters[0]?.id ?? null);
        const tabFromUrl = parseTabParam(searchParams.get("tab"));
        if (tabFromUrl) {
          setTab(tabFromUrl);
        } else if (searchParams.get("videoOrder")) {
          setTab("series");
        } else if (fromDemoId || searchParams.get("story")) {
          setTab("editor");
        }
      }

      if (fromDemoId) {
        window.localStorage.removeItem(STORY_INTENDED_STORY_KEY);
        setDemoWelcomeStoryId(fromDemoId);
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

  function applyStoryQuota(q: unknown) {
    const quotaData = q as {
      remaining: number;
      credits: number;
      portraitFreeRemaining?: number;
    };

    setQuota((current) => ({
      remaining: quotaData.remaining,
      credits: quotaData.credits,
      portraitFreeRemaining: quotaData.portraitFreeRemaining,
      storyPremiumUnlocked: current?.storyPremiumUnlocked
    }));
  }

  async function handleDeleteStory(storyId: string) {
    const target = stories.find((s) => s.id === storyId);
    if (!target) return;
    const confirmed = window.confirm(`Удалить историю «${target.title}»? Это действие нельзя отменить.`);
    if (!confirmed) return;

    setDeleteLoadingId(storyId);
    setError("");
    try {
      await deleteStoryProject(storyId);
      const nextStories = stories.filter((s) => s.id !== storyId);
      setStories(nextStories);
      if (activeStory?.id === storyId) {
        const next = nextStories[0] ?? null;
        setActiveStory(next);
        setSelectedCharacterId(next?.characters[0]?.id ?? null);
      }
    } catch {
      setError("Не удалось удалить историю.");
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleGenerateCharacter() {
    if (!activeStory) return;
    setCharacterLoading(true);
    setError("");
    try {
      const { story, quota: q } = await generateStoryCharacter(activeStory.id, {
        hint: charHint.trim() || undefined
      });
      handleStoryUpdate(story);
      applyStoryQuota(q);
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
      applyStoryQuota(q);
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
      applyStoryQuota(q);
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
      applyStoryQuota(q);
      setTab("editor");
      trackMarketingEvent("story_chapter_generated", {
        storyId: story.id,
        chapterCount: story.chapters.length
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации главы");
    } finally {
      setChapterLoading(false);
    }
  }

  function handleTabChange(next: Tab) {
    setTab(next);
    if (activeStory) {
      trackMarketingEvent("story_cabinet_tab_view", { storyId: activeStory.id, tab: next });
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen">
        <StoryStudioHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-24 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-gold" />
          <h1 className="story-fairy-title text-3xl text-moon">Войдите в аккаунт</h1>
          <p className="mt-2 text-muted">Чтобы работать с историями и персонажами</p>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(registerCallbackUrl)}`}
            className="mt-6"
          >
            <Button className="!border-gold !bg-gold !text-[#1a140f]">Создать аккаунт</Button>
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
    { id: "read", label: "Читать", icon: Share2, highlight: true },
    { id: "analysis", label: "Анализ", icon: ScanSearch, highlight: true },
    { id: "media", label: "Медиа", icon: ImageIcon, highlight: true },
    { id: "pricing", label: "Тарифы", icon: Wallet }
  ];

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <StoryStudioHeader />
      </div>

      <div className="mx-auto max-w-content px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 print:pt-0">
        <div className="mb-6 flex flex-col gap-4 print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="story-fairy-eyebrow mb-2">Кабинет автора</p>
            <h1 className="story-fairy-title text-3xl text-moon sm:text-4xl">Мои истории</h1>
            {quota && (
              <p className="text-sm text-muted">
                Осталось генераций: <span className="text-violet">{quota.remaining}</span> из {quota.credits}
                {typeof quota.portraitFreeRemaining === "number" && (
                  <>
                    {" "}
                    · портретов: <span className="text-violet">{quota.portraitFreeRemaining}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <Link href="/storystudio/create" className="w-full sm:w-auto">
            <Button className="w-full !border-violet !bg-violet !text-white sm:w-auto">
              <Plus className="h-4 w-4" />
              Новая история
            </Button>
          </Link>
        </div>

        {demoWelcomeStoryId && activeStory?.id === demoWelcomeStoryId && (
          <div className="mb-6 rounded-card border border-violet/30 bg-violet/10 p-5 print:hidden">
            <p className="text-sm text-ink">
              <Sparkles className="mr-1.5 inline h-4 w-4 text-violet" />
              Демо-история перенесена в ваш кабинет — можно продолжать редактирование, генерировать главы и
              персонажей.
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-muted underline hover:text-ink"
              onClick={() => setDemoWelcomeStoryId(null)}
            >
              Скрыть
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet" />
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/15 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-violet" />
            <h2 className="text-xl font-semibold">Пока нет историй</h2>
            <p className="mt-2 text-muted">Создайте первую с помощью ИИ за 30 секунд</p>
            <Link href="/storystudio/create" className="mt-6 inline-block">
              <Button className="!bg-violet !text-white !border-violet">Создать историю</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:gap-6">
            <aside className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden lg:mx-0 lg:block lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`relative w-[min(100%,240px)] shrink-0 rounded-xl border transition lg:w-full ${
                    activeStory?.id === story.id
                      ? "border-violet bg-violet/15"
                      : "border-white/10 bg-card hover:border-violet/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStory(story);
                      setSelectedCharacterId(story.characters[0]?.id ?? null);
                    }}
                    className="w-full px-4 py-3 pr-10 text-left"
                  >
                    <div className="font-medium text-ink">{story.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {story.characters.length} перс. · {story.chapters.length} гл.
                      {story.isPublic ? " · публичная" : ""}
                    </div>
                  </button>
                  <button
                    type="button"
                    title="Удалить историю"
                    disabled={deleteLoadingId === story.id}
                    onClick={() => handleDeleteStory(story.id)}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-muted hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    {deleteLoadingId === story.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </aside>

            {activeStory && (
              <div className="min-w-0">
                <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto border-b border-white/10 px-4 pb-4 print:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTabChange(t.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition sm:px-3.5 ${
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
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 print:hidden">
                    {error}
                  </div>
                )}

                <div className="print:hidden">
                  <StoryOnboardingChecklist story={activeStory} onGoToTab={handleTabChange} />
                </div>

                {tab === "overview" && (
                  <div className="space-y-6">
                    {activeStory.needsAiRefresh && (
                      <StoryAiRefreshBanner loading={regenerateLoading} onRefresh={handleRegenerateFoundation} />
                    )}

                    {isStoryFoundationEmpty(activeStory) && (
                      <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-5">
                        <p className="text-sm text-amber-100">
                          Контент истории не сгенерировался — ИИ не вернул данные. Нажмите кнопку ниже, чтобы
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

                    <StoryOverviewEditor
                      story={activeStory}
                      onUpdate={handleStoryUpdate}
                      onError={setError}
                    />
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
                    onOpenCharacters={() => handleTabChange("characters")}
                  />
                )}

                {tab === "read" && (
                  <StoryShareReadPanel
                    story={activeStory}
                    onUpdate={handleStoryUpdate}
                    onError={setError}
                  />
                )}

                {tab === "analysis" && (
                  <StoryAnalysisPanel
                    story={activeStory}
                    onUpdate={handleStoryUpdate}
                    onError={setError}
                    applyQuota={applyStoryQuota}
                  />
                )}

                {tab === "media" && (
                  <StoryMediaPanel
                    story={activeStory}
                    onUpdate={handleStoryUpdate}
                    onError={setError}
                    applyQuota={applyStoryQuota}
                  />
                )}

                {tab === "pricing" && (
                  <div id="pricing" className="space-y-6">
                    {!quota?.storyPremiumUnlocked && (
                      <StoryPremiumUpsellBanner onOpenPricing={() => handleTabChange("pricing")} />
                    )}
                    <div className="rounded-card border border-violet/30 bg-violet/10 p-5">
                      <p className="text-sm">
                        {STORY_GENERATION_EXPLAINER} ·{" "}
                        <strong>{formatStoryRub(STORY_GENERATION_PRICE_RUB)}</strong>
                      </p>
                    </div>
                    <div className="rounded-card border border-white/10 bg-card/50 p-5">
                      <PromoCodeForm
                        product="storystudio"
                        onSuccess={(result) => {
                          applyStoryQuota(result.quota);
                        }}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {STORY_PACKAGES.map((pkg) => {
                        const price = calculateStoryPackagePrice(pkg.count);

                        return (
                          <StoryPricingCard
                            key={pkg.id}
                            name={pkg.label}
                            price={formatStoryRub(price.total)}
                            period={`${formatStoryRub(price.pricePerUnit)}/ген · −${price.savingsPercent}%`}
                            features={pkg.features}
                            badge={pkg.badge}
                            highlighted={Boolean(pkg.badge)}
                            footer={
                              <StoryPaymentButton
                                count={pkg.count}
                                className="w-full !border-violet !bg-violet !text-white"
                              >
                                Купить {pkg.count}
                              </StoryPaymentButton>
                            }
                          />
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
      <div className="print:hidden">
        <StoryStudioFooter />
      </div>
    </div>
  );
}
