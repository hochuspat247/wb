"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { StoryPremiumUpsellBanner } from "@/components/storystudio/StoryPremiumUpsellBanner";
import { generateStoryDemo, generateStoryFoundation } from "@/lib/api/storystudio";
import { fetchUserQuota } from "@/lib/api/user";
import { getOrCreateStoryGuestId } from "@/lib/guest";
import { STORY_GENRES, WORD_COUNT_PRESETS } from "@/lib/storystudio/constants";
import type { StoryGenre, StoryLanguage } from "@/types/storystudio";

export function StoryCreateForm() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [charactersHint, setCharactersHint] = useState("");
  const [genres, setGenres] = useState<StoryGenre[]>(["fantasy"]);
  const [language, setLanguage] = useState<StoryLanguage>("ru");
  const [targetWordCount, setTargetWordCount] = useState(16000);
  const [premiumMode, setPremiumMode] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setPremiumUnlocked(false);
      setPremiumMode(false);
      return;
    }

    fetchUserQuota()
      .then((quota) => setPremiumUnlocked(Boolean(quota.storyPremiumUnlocked)))
      .catch(() => setPremiumUnlocked(false));
  }, [isAuthenticated]);

  function toggleGenre(id: StoryGenre) {
    setGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id].slice(0, 4)));
  }

  function handlePremiumToggle(checked: boolean) {
    if (checked && !premiumUnlocked) {
      setPremiumMode(false);
      return;
    }
    setPremiumMode(checked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !premise.trim()) {
      setError("Заполните название и основную идею.");
      return;
    }
    if (!genres.length) {
      setError("Выберите хотя бы один жанр.");
      return;
    }
    if (premiumMode && !premiumUnlocked) {
      setError("Режим 18+ доступен только с пакетом «Автор» или выше.");
      return;
    }

    setLoading(true);
    setError("");

    const input = {
      title: title.trim(),
      premise: premise.trim(),
      charactersHint: charactersHint.trim() || undefined,
      genres,
      language,
      targetWordCount,
      premiumMode
    };

    try {
      if (isAuthenticated) {
        const { story } = await generateStoryFoundation(input);
        router.push(`/storystudio/cabinet?story=${story.id}`);
        return;
      }

      const guestId = getOrCreateStoryGuestId();
      const { story } = await generateStoryDemo({ ...input, guestId });
      router.push(`/storystudio/preview/${story.id}?guestId=${encodeURIComponent(guestId)}`);
    } catch (err) {
      if (err instanceof Error && err.message === "Failed to fetch") {
        setError("Нет соединения с сервером.");
        return;
      }
      const e = err as Error & { code?: string };
      if (e.code === "QUOTA_EXCEEDED") {
        setError("Генерации закончились. Купите пакет в кабинете.");
        return;
      }
      if (e.code === "PREMIUM_REQUIRED") {
        setError(e.message || "Режим 18+ доступен только с премиум-пакетом.");
        return;
      }
      if (e.code === "DEMO_LIMIT_EXCEEDED" || e.code === "RATE_LIMIT_EXCEEDED") {
        setError(e.message || "Лимит демо исчерпан. Зарегистрируйтесь, чтобы продолжить.");
        return;
      }
      if (e.message.includes("401") || e.message.includes("Войдите")) {
        router.push(`/register?callbackUrl=${encodeURIComponent("/storystudio/create")}`);
        return;
      }
      setError(e.message || "Не удалось создать историю.");
    } finally {
      setLoading(false);
    }
  }

  const showPremiumUpsell = premiumMode || (!premiumUnlocked && isAuthenticated);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Режим истории</h2>
          <label
            className={`flex items-center gap-2 text-sm ${premiumUnlocked ? "cursor-pointer text-muted" : "cursor-not-allowed text-muted/60"}`}
          >
            <input
              type="checkbox"
              checked={premiumMode}
              disabled={!premiumUnlocked}
              onChange={(e) => handlePremiumToggle(e.target.checked)}
              className="h-4 w-4 rounded border-clay accent-violet disabled:opacity-50"
            />
            <span>
              Премиум 18+ <span className="text-violet">✦</span>
            </span>
          </label>
        </div>

        {!isAuthenticated && (
          <StoryPremiumUpsellBanner variant="inline" />
        )}

        {isAuthenticated && !premiumUnlocked && (
          <div className="mb-4">
            <StoryPremiumUpsellBanner variant="inline" />
          </div>
        )}

        {showPremiumUpsell && premiumUnlocked && premiumMode && (
          <p className="mb-4 rounded-xl bg-violet/10 px-4 py-3 text-sm text-muted">
            Может включать откровенные сцены, грубую лексику и взрослые темы.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Заголовок</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наследник исчез за день до коронации"
              maxLength={120}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Основная идея</label>
            <Textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Пустой трон опаснее мятежа, особенно когда исчезновение наследника слишком удобно для всех фракций двора..."
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Персонажи (необязательно)</label>
            <Textarea
              value={charactersHint}
              onChange={(e) => setCharactersHint(e.target.value)}
              placeholder="Принцесса-интриганка, телохранитель с прошлым, старый советник..."
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card">
        <label className="mb-3 block text-sm font-medium text-ink">Примерный объём произведения</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WORD_COUNT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setTargetWordCount(preset.value)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                targetWordCount === preset.value
                  ? "border-violet bg-violet/15 text-ink"
                  : "border-white/10 text-muted hover:border-violet/30"
              }`}
            >
              <div className="text-sm font-semibold">{preset.short}</div>
              <div className="text-xs opacity-70">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card">
        <label className="mb-3 block text-sm font-medium text-ink">Жанры</label>
        <div className="flex flex-wrap gap-2">
          {STORY_GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                genres.includes(genre.id)
                  ? "border-violet bg-violet/20 text-ink"
                  : "border-white/10 text-muted hover:border-violet/30"
              }`}
            >
              {genre.emoji} {genre.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card">
        <label className="mb-3 block text-sm font-medium text-ink">Язык произведения</label>
        <div className="flex gap-2">
          {(["ru", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`rounded-full border px-4 py-2 text-sm ${
                language === lang ? "border-violet bg-violet/20 text-ink" : "border-white/10 text-muted"
              }`}
            >
              {lang === "ru" ? "Русский" : "Английский"}
            </button>
          ))}
        </div>
      </div>

      {!isAuthenticated && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-muted">
          Бесплатное демо без регистрации. После генерации вы увидите превью — чтобы редактировать историю и
          продолжать работу, нужен аккаунт (защита от спам-ботов).
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          {error.includes("закончились") && (
            <Link href="/storystudio/cabinet#pricing" className="ml-2 underline">
              Купить генерации
            </Link>
          )}
          {(error.includes("премиум") || error.includes("18+")) && (
            <Link href="/storystudio/cabinet#pricing" className="ml-2 underline">
              Оформить премиум
            </Link>
          )}
          {error.includes("Зарегистрируйтесь") && (
            <Link href="/register?callbackUrl=/storystudio/create" className="ml-2 underline">
              Регистрация
            </Link>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full !bg-violet !text-white !border-violet hover:!bg-[#9d8bff]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Создаём историю с ИИ... (1–2 мин)
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            {isAuthenticated ? "Создать с ИИ" : "Попробовать бесплатно"}
          </>
        )}
      </Button>
    </form>
  );
}
