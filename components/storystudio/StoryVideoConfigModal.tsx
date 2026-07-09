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
import { fetchVideoCredits } from "@/lib/api/video";
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-violet/20 bg-card p-6 shadow-soft md:p-8">
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
        <h3 className="mt-3 text-2xl font-bold text-ink">Снять сцену из истории</h3>
        <p className="mt-2 text-sm text-muted">
          Анимируем портрет {character.name} в кинематографичную сцену. Собирайте серии как эпизоды — конкурентное
          преимущество StoryStudio перед Novely.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-[160px_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/10">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={character.name} className="aspect-[3/4] w-full object-cover" src={previewSrc} />
            ) : (
              <div className="grid aspect-[3/4] place-items-center text-xs text-muted">Нет портрета</div>
            )}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Название серии
              <Input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Описание сцены
              <Textarea value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)} rows={3} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Длительность
              <Select value={duration} onChange={(e) => setDuration(e.target.value as VideoDuration)}>
                {VIDEO_DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {getVideoDurationOptionLabel(o.value, quality, generateAudio)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Формат
              <Select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}>
                <option value="9:16">9:16 — Reels / Shorts / TikTok</option>
                <option value="16:9">16:9 — широкий кадр</option>
                <option value="4:5">4:5 — вертикаль</option>
                <option value="1:1">1:1 — квадрат</option>
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Качество
              <Select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)}>
                <option value="standard">{getVideoQualityLabel("standard")}</option>
                <option value="pro">{getVideoQualityLabel("pro")}</option>
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Стиль движения
              <Select value={motionStyle} onChange={(e) => setMotionStyle(e.target.value as VideoMotionStyle)}>
                {motionOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" checked={generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)} className="mt-0.5" />
              <span>Со звуком (ambient, атмосфера сцены) — ×1.5 к цене</span>
            </label>
            {needsPayment && (
              <label className="grid gap-1 text-xs font-semibold text-muted">
                Email для чека
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </label>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-violet/20 bg-violet/5 px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            Стоимость: {isUnlimited ? "Бесплатно" : formatVideoPriceRub(amountRub)}
          </p>
          {!isUnlimited && <p className="text-xs text-muted">{formatVideoPriceBreakdown(duration, quality, generateAudio)}</p>}
          {!isUnlimited && (
            <p className="mt-1 text-xs text-muted">Минимум от {formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)} · Novely видео не делает</p>
          )}
          {canUseCredit && <p className="mt-1 text-xs text-muted">Video-credits: {videoCredits}</p>}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {canUseCredit && (
            <Button className="flex-1 !bg-violet !text-white !border-violet" disabled={loading} onClick={() => void handleSubmit(true)}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Списать 1 credit
            </Button>
          )}
          <Button
            className="flex-1 !bg-violet !text-white !border-violet"
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
  );
}
