"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X, Clapperboard } from "lucide-react";
import {
  calculateVideoPriceRub,
  formatVideoPriceBreakdown,
  formatVideoPriceRub,
  getVideoDurationOptionLabel,
  getVideoQualityLabel,
  VIDEO_DURATION_OPTIONS,
  VIDEO_STANDARD_PRICE_4_SEC
} from "@/config/video-pricing";
import { createStoryVideoOrder } from "@/lib/api/storystudio";
import { fetchUserProfile } from "@/lib/api/user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { StoryCharacter, StoryChapter, StoryProject } from "@/types/storystudio";
import type { VideoAspectRatio, VideoDuration, VideoMotionStyle, VideoQuality } from "@/types/video-generation";

const motionOptions: Array<{ value: VideoMotionStyle; label: string }> = [
  { value: "premium_parallax", label: "Кинематографичный parallax" },
  { value: "soft_zoom", label: "Медленный наезд" },
  { value: "light_sweep", label: "Свет и атмосфера" },
  { value: "marketplace_motion", label: "Динамичная камера" }
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type StoryVideoConfigModalProps = {
  open: boolean;
  story: StoryProject;
  character: StoryCharacter;
  chapter?: StoryChapter;
  videoCredits: number;
  onClose: () => void;
  onOrderCreated: (orderId: string, story: StoryProject) => void;
};

export function StoryVideoConfigModal({
  open,
  story,
  character,
  chapter,
  videoCredits,
  onClose,
  onOrderCreated
}: StoryVideoConfigModalProps) {
  const [duration, setDuration] = useState<VideoDuration>("6");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("9:16");
  const [quality, setQuality] = useState<VideoQuality>("standard");
  const [motionStyle, setMotionStyle] = useState<VideoMotionStyle>("premium_parallax");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [sceneDescription, setSceneDescription] = useState(chapter?.summary || "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailIsPlaceholder, setEmailIsPlaceholder] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = character.imageBase64
    ? `data:${character.imageMimeType || "image/png"};base64,${character.imageBase64}`
    : character.imageUrl || "";

  const amountRub = useMemo(
    () => calculateVideoPriceRub(duration, quality, generateAudio),
    [duration, quality, generateAudio]
  );
  const canUseCredit = videoCredits > 0 && !isUnlimited;
  const needsPayment = !isUnlimited && !canUseCredit;

  useEffect(() => {
    if (!open) return;
    setSceneDescription(chapter?.summary || story.hook || "");
    setEpisodeTitle(chapter ? `Серия: ${chapter.title}` : `Серия: ${character.name}`);
    fetchUserProfile()
      .then((profile) => {
        setCustomerEmail(profile.emailDisplay || profile.email || "");
        setEmailIsPlaceholder(Boolean(profile.emailIsPlaceholder));
        setIsUnlimited(Boolean(profile.quota?.unlimited));
      })
      .catch(() => undefined);
  }, [open, chapter, character.name, story.hook]);

  if (!open) return null;

  async function handleSubmit(useVideoCredit = false) {
    if (needsPayment && emailIsPlaceholder && !isValidEmail(customerEmail.trim())) {
      setError("Укажите корректный email для чека.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createStoryVideoOrder({
        storyId: story.id,
        characterId: character.id,
        chapterId: chapter?.id,
        episodeTitle: episodeTitle.trim() || undefined,
        sceneDescription: sceneDescription.trim() || undefined,
        duration,
        aspectRatio,
        quality,
        motionStyle,
        generateAudio,
        useVideoCredit,
        customerEmail: needsPayment && emailIsPlaceholder ? customerEmail.trim() : undefined
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      onOrderCreated(result.orderId, result.story);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Не удалось создать видео.";
      if (message === "EMAIL_REQUIRED") setEmailIsPlaceholder(true);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-violet/20 bg-card shadow-soft">
        <div className="shrink-0 border-b border-white/10 px-5 py-4 pr-14 sm:px-6">
          <button
            aria-label="Закрыть"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet">
            <Clapperboard className="h-4 w-4" />
            Google Veo 3.1 · Видео-серия
          </div>
          <h3 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Снять сцену из истории</h3>
          <p className="mt-1 text-sm text-muted">
            Анимируем портрет <span className="font-medium text-ink">{character.name}</span> в кинематографичную сцену.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[168px_minmax(0,1fr)] lg:gap-6">
            <div className="mx-auto w-full max-w-[168px] shrink-0 lg:mx-0">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={character.name} className="aspect-[3/4] w-full object-cover" src={previewSrc} />
                ) : (
                  <div className="grid aspect-[3/4] place-items-center px-3 text-center text-xs text-muted">
                    Нет портрета
                  </div>
                )}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-ink lg:text-left">{character.name}</p>
              <p className="text-center text-[11px] text-muted lg:text-left">{character.role}</p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-muted sm:col-span-2">
                Название серии
                <Input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted sm:col-span-2">
                Описание сцены
                <Textarea value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)} rows={3} />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Длительность
                <Select value={duration} onChange={(e) => setDuration(e.target.value as VideoDuration)}>
                  {VIDEO_DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {getVideoDurationOptionLabel(o.value, quality, generateAudio)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Формат
                <Select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}>
                  <option value="9:16">9:16 — Reels / Shorts</option>
                  <option value="16:9">16:9 — широкий кадр</option>
                  <option value="4:5">4:5 — вертикаль</option>
                  <option value="1:1">1:1 — квадрат</option>
                </Select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Качество
                <Select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)}>
                  <option value="standard">{getVideoQualityLabel("standard")}</option>
                  <option value="pro">{getVideoQualityLabel("pro")}</option>
                </Select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Стиль движения
                <Select value={motionStyle} onChange={(e) => setMotionStyle(e.target.value as VideoMotionStyle)}>
                  {motionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  checked={generateAudio}
                  onChange={(e) => setGenerateAudio(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Со звуком (ambient, атмосфера сцены) — ×1.5 к цене</span>
              </label>

              {needsPayment && (
                <label className="grid gap-1.5 text-xs font-semibold text-muted sm:col-span-2">
                  Email для чека
                  <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-card/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="rounded-xl border border-violet/20 bg-violet/5 px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              Стоимость: {isUnlimited ? "Бесплатно" : formatVideoPriceRub(amountRub)}
            </p>
            {!isUnlimited && <p className="text-xs text-muted">{formatVideoPriceBreakdown(duration, quality, generateAudio)}</p>}
            {!isUnlimited && (
              <p className="mt-0.5 text-xs text-muted">Минимум от {formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}</p>
            )}
            {canUseCredit && <p className="mt-0.5 text-xs text-muted">Video-credits: {videoCredits}</p>}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {canUseCredit && (
              <Button
                className="flex-1 !border-violet !bg-violet !text-white"
                disabled={loading}
                onClick={() => void handleSubmit(true)}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                Списать 1 credit
              </Button>
            )}
            <Button
              className="flex-1 !border-violet !bg-violet !text-white"
              disabled={loading}
              variant={canUseCredit ? "secondary" : "primary"}
              onClick={() => void handleSubmit(false)}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              {isUnlimited ? "Снять серию" : "Оплатить и снять"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
