"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, Clapperboard, Eye, Film, MousePointerClick, Star, Users, X } from "lucide-react";
import { Funnel7dPanel } from "@/components/admin/Funnel7dPanel";
import { LiveVisitorsPanel } from "@/components/admin/LiveVisitorsPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { CollapsibleAdminSection } from "@/components/admin/CollapsibleAdminSection";
import { DemoErrorsPanel } from "@/components/admin/DemoErrorsPanel";
import { SessionDurationPanel } from "@/components/admin/SessionDurationPanel";
import { StoryDetailModal, type AdminStoryDetail } from "@/components/admin/StoryDetailModal";
import { UserJourneysMapPanel } from "@/components/admin/UserJourneysMapPanel";
import { CardSavedVideosPanel } from "@/components/video/CardSavedVideosPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatAccountEmail, getEmailVerificationLabel } from "@/lib/auth/email-utils";
import { hasCardGeneratedVideo } from "@/lib/cardVideos";
import type { ProductCardResult } from "@/types/product-card";
import type { SessionDurationStats } from "@/lib/server/session-duration";
import type { Funnel7dStep } from "@/lib/server/funnel7d";
import { ADMIN_PRODUCTS, isAdminProductId, type AdminProductId } from "@/lib/admin/products";
import { BRAND } from "@/lib/branding";

type AdminStats = {
  product?: AdminProductId;
  overview: {
    users: number;
    cards: number;
    demoGenerations: number;
    totalGenerations: number;
    events7d: number;
  };
  storyStudio?: {
    overview: {
      stories: number;
      characters: number;
      chapters: number;
      episodes: number;
      videoEpisodes: number;
      storyVideos: number;
    };
    recentStories: {
      id: string;
      userId: string;
      userName: string | null;
      userEmail: string | null;
      title: string;
      premise: string;
      status: string;
      genres: string[];
      charactersCount: number;
      chaptersCount: number;
      episodesCount: number;
      premiumMode: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
  } | null;
  funnel: {
    pageViews: number;
    ctaClicks: number;
    registrations: number;
    logins: number;
    generations: number;
    paywallViews: number;
    paymentClicks: number;
  };
  funnel7d: Funnel7dStep[];
  heatmap: { x: number; y: number; count: number }[];
  topClicks: { label: string; count: number }[];
  signupsByDay: { day: string; value: number }[];
  generationsByDay: { day: string; value: number }[];
  sessionDuration: SessionDurationStats;
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    hasPasswordAccount: boolean;
    generationsUsed: number;
    generationCredits: number;
    createdAt: Date;
    projectStoriesCount?: number;
    projectCardsCount?: number;
    projectDemosCount?: number;
    lastProjectActivityAt?: Date;
  }[];
  recentCards: {
    id: string;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    title: string;
    marketplace: string;
    style: string;
    category: string;
    generatedAt: string;
    createdAt: Date;
    generationRating?: 1 | 2 | 3 | 4 | 5;
    videoCount: number;
  }[];
  recentDemos: {
    id: string;
    guestId: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    status: string;
    title: string;
    category: string;
    marketplace: string;
    productDescription: string;
    generatedAt: string;
    createdAt: Date;
    generationRating?: 1 | 2 | 3 | 4 | 5;
    generationRatingDismissedAt?: string;
    provider?: string;
  }[];
  recentDemoErrors: {
    id: string;
    eventName: string;
    path: string;
    sessionId: string;
    userId: string | null;
    guestId: string | null;
    message: string;
    code: string | null;
    status: number | null;
    source: string | null;
    createdAt: Date;
  }[];
  userJourneys: {
    sessionId: string;
    guestId: string | null;
    userId: string | null;
    firstSeenAt: Date;
    lastSeenAt: Date;
    eventsCount: number;
    pageViews: number;
    clicks: number;
    conversions: number;
    currentPathLabel: string | null;
    lastActionLabel: string | null;
    paths: string[];
    events: {
      eventType: string;
      eventName: string;
      path: string;
      label: string | null;
      createdAt: Date;
    }[];
  }[];
};

type AdminCardDetail = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
  payload: ProductCardResult;
};

type AdminDemoDetail = {
  id: string;
  guestId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  status: string;
  createdAt: Date;
  payload: ProductCardResult;
  originalImageDataUrl: string;
  previewImageDataUrl: string;
};

const PRODUCT_STORAGE_KEY = "admin-selected-product";

function readStoredProduct(): AdminProductId {
  if (typeof window === "undefined") return "marketcard";
  const stored = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
  return isAdminProductId(stored) ? stored : "marketcard";
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function MiniBars({ rows, label }: { rows: { day: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink">{label}</p>
      <div className="flex h-28 items-end gap-1 overflow-hidden">
        {rows.map((row) => (
          <div className="flex flex-1 flex-col items-center gap-1" key={row.day}>
            <div
              className="w-full rounded-t bg-accent/80"
              style={{ height: `${Math.max(8, (row.value / max) * 100)}%` }}
              title={`${row.day}: ${row.value}`}
            />
            <span className="text-[10px] text-muted">{row.day.slice(5)}</span>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-muted">Нет данных</p> : null}
      </div>
    </div>
  );
}

function getUploadedImage(card: ProductCardResult) {
  return card.imageDataUrl || null;
}

function getGeneratedImage(card: ProductCardResult) {
  if (card.generatedImageUrl) return card.generatedImageUrl;
  if (card.generatedImageDataUrl) return card.generatedImageDataUrl;
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return `data:${card.generatedImageMimeType};base64,${card.generatedImageBase64}`;
  }
  return null;
}

function ImagePair({
  uploadedSrc,
  generatedSrc,
  title,
  generatedFallbackLabel
}: {
  uploadedSrc?: string | null;
  generatedSrc?: string | null;
  title: string;
  generatedFallbackLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Загрузил пользователь</p>
        <div className="overflow-hidden rounded-card border border-clay bg-paper">
          {uploadedSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${title} — загрузка`} className="aspect-[4/5] w-full object-cover" src={uploadedSrc} />
          ) : (
            <div className="grid aspect-[4/5] place-items-center px-4 text-center text-sm font-semibold text-muted">
              Фото не сохранилось
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Результат генерации</p>
        <div className="overflow-hidden rounded-card border border-clay bg-paper">
          {generatedSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${title} — результат`} className="aspect-[4/5] w-full object-cover" src={generatedSrc} />
          ) : (
            <div className="grid aspect-[4/5] place-items-center px-4 text-center text-sm font-semibold text-muted">
              {generatedFallbackLabel || "ИИ-обложка ещё не готова"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{String(value)}</p>
    </div>
  );
}

function RatingValue({ rating }: { rating?: number | null }) {
  if (!rating) {
    return <span className="text-sm font-semibold text-muted">Без оценки</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-black text-ink">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          className={index < rating ? "fill-accent text-accent" : "text-clay"}
          key={index}
          size={16}
        />
      ))}
      <span className="ml-1">{rating}/5</span>
    </span>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

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

function CardDetailModal({
  detail,
  loading,
  onClose
}: {
  detail: AdminCardDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!detail && !loading) return null;

  const card = detail?.payload;
  const source = card?.sourceInput;
  const uploadedImage = card ? getUploadedImage(card) : null;
  const generatedImage = card ? getGeneratedImage(card) : null;
  const generatedFallbackLabel = card?.generatedImageIsFallback
    ? card.generatedImageError || "NanoBanana не вернул ИИ-обложку"
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm md:items-center">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden p-0" padding="none">
        <div className="flex items-center justify-between gap-4 border-b border-clay px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Карточка пользователя</p>
            <h3 className="mt-1 truncate text-lg font-black text-ink">{card?.title || "Загрузка..."}</h3>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-paper" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <Loader label="Загружаем карточку..." />
          </div>
        ) : card && detail ? (
          <div className="grid max-h-[calc(92vh-78px)] gap-6 overflow-y-auto p-5 lg:grid-cols-[360px_1fr]">
            <div className="space-y-4">
              <ImagePair
                generatedFallbackLabel={generatedFallbackLabel}
                generatedSrc={generatedImage}
                title={card.title}
                uploadedSrc={uploadedImage}
              />
              <div className="grid gap-3">
                <DetailField label="Пользователь" value={detail.userName || "Без имени"} />
                <DetailField label="Email" value={detail.userEmail ? formatAccountEmail(detail.userEmail) : "Нет email"} />
                <DetailField label="Дата" value={new Date(detail.createdAt).toLocaleString("ru-RU")} />
                <DetailField label="Провайдер" value={card.generatedImageProvider || card.provider} />
                <DetailField label="Fallback" value={card.generatedImageIsFallback ?? card.isFallback} />
                <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Оценка генерации</p>
                  <div className="mt-1">
                    <RatingValue rating={card.generationRating} />
                  </div>
                </div>
                <DetailField label="Оценено" value={card.generationRatedAt ? new Date(card.generationRatedAt).toLocaleString("ru-RU") : null} />
                <DetailField label="Окно оценки закрыто" value={card.generationRatingDismissedAt ? new Date(card.generationRatingDismissedAt).toLocaleString("ru-RU") : null} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Маркетплейс" value={card.marketplace} />
                <DetailField label="Площадка" value={card.platform} />
                <DetailField label="Категория" value={card.category} />
                <DetailField label="Стиль" value={card.style} />
                <DetailField label="Пресет" value={card.designPreset} />
                <DetailField label="Режим текста" value={card.textMode} />
                <DetailField label="Заголовок на обложке" value={card.headline} />
                <DetailField label="Цена" value={card.price} />
                <DetailField label="CTA" value={card.ctaText} />
              </div>

              <TextBlock label="Короткое описание" value={card.shortDescription} />
              <TextBlock label="Полное описание" value={card.fullDescription} />
              <ListBlock label="Преимущества" items={card.benefits} />
              <ListBlock label="Ключевые слова" items={card.keywords} />
              <ListBlock label="Тексты для инфографики" items={card.infographicTexts} />
              <TextBlock label="Визуальная концепция" value={card.visualConcept} />
              <TextBlock label="Промпт изображения" value={card.generatedImagePrompt} />
              <TextBlock label="Ошибка генерации" value={card.generatedImageError} />
              <CardSavedVideosPanel card={card} />

              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Что вводил пользователь</h4>
                {source ? (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <DetailField label="Описание товара" value={source.productDescription} />
                    <DetailField label="Категория" value={source.category} />
                    <DetailField label="Маркетплейс" value={source.marketplace} />
                    <DetailField label="Стиль" value={source.style} />
                    <DetailField label="Файл" value={source.imageFileName} />
                    <DetailField label="Бренд" value={source.brand} />
                    <DetailField label="Артикул" value={source.sellerSku} />
                    <DetailField label="Цвет" value={source.color} />
                    <DetailField label="Размер" value={source.size} />
                    <DetailField label="Материал" value={source.material} />
                    <DetailField label="Габариты" value={source.dimensions} />
                    <DetailField label="Вес" value={source.weight} />
                    <DetailField label="Комплектация" value={source.packageContents} />
                    <DetailField label="Аудитория" value={source.targetAudience} />
                    <DetailField label="Сценарий" value={source.useCase} />
                    <DetailField label="Цена" value={source.price} />
                    <DetailField label="Старая цена" value={source.oldPrice} />
                    <DetailField label="Скидка" value={source.discount} />
                    <DetailField label="Заголовок" value={source.headline} />
                    <DetailField label="CTA" value={source.ctaText} />
                    <DetailField label="Пресет" value={source.designPreset} />
                    <DetailField label="Режим изображения" value={source.imageMode} />
                    <DetailField label="Удалял фон" value={source.removeBackground} />
                  </div>
                ) : (
                  <p className="mt-2 rounded-[14px] border border-clay bg-paper/40 p-4 text-sm text-muted">
                    Для старых карточек исходные поля еще не сохранялись отдельно. Ниже доступен результат генерации и промпт.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function DemoDetailModal({
  detail,
  loading,
  onClose
}: {
  detail: AdminDemoDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!detail && !loading) return null;

  const card = detail?.payload;
  const source = card?.sourceInput;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm md:items-center">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden p-0" padding="none">
        <div className="flex items-center justify-between gap-4 border-b border-clay px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Демо гостя</p>
            <h3 className="mt-1 truncate text-lg font-black text-ink">{card?.title || "Загрузка..."}</h3>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-paper" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <Loader label="Загружаем демо..." />
          </div>
        ) : card && detail ? (
          <div className="grid max-h-[calc(92vh-78px)] gap-6 overflow-y-auto p-5 lg:grid-cols-[380px_1fr]">
            <div className="space-y-4">
              <ImagePair
                generatedSrc={detail.previewImageDataUrl}
                title={card.title}
                uploadedSrc={detail.originalImageDataUrl}
              />
              <div className="grid gap-3">
                <DetailField label="Гость" value={detail.guestId} />
                <DetailField label="Пользователь" value={detail.userName || (detail.userEmail ? formatAccountEmail(detail.userEmail) : "Не зарегистрирован")} />
                <DetailField label="Дата" value={new Date(detail.createdAt).toLocaleString("ru-RU")} />
                <DetailField label="Статус" value={detail.status} />
                <DetailField label="Провайдер" value={card.generatedImageProvider || card.provider} />
                <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Оценка генерации</p>
                  <div className="mt-1">
                    <RatingValue rating={card.generationRating} />
                  </div>
                </div>
                <DetailField label="Оценено" value={card.generationRatedAt ? new Date(card.generationRatedAt).toLocaleString("ru-RU") : null} />
                <DetailField label="Оценка закрыта" value={card.generationRatingDismissedAt ? new Date(card.generationRatingDismissedAt).toLocaleString("ru-RU") : null} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Маркетплейс" value={card.marketplace} />
                <DetailField label="Категория" value={card.category} />
                <DetailField label="Стиль" value={card.style} />
                <DetailField label="Пресет" value={card.designPreset} />
                <DetailField label="Режим текста" value={card.textMode} />
                <DetailField label="Fallback" value={card.generatedImageIsFallback ?? card.isFallback} />
              </div>

              <TextBlock label="Что ввёл пользователь" value={source?.productDescription || card.shortDescription} />
              <TextBlock label="Короткое описание" value={card.shortDescription} />
              <TextBlock label="Полное описание" value={card.fullDescription} />
              <ListBlock label="Преимущества" items={card.benefits} />
              <ListBlock label="Тексты для инфографики" items={card.infographicTexts} />
              <TextBlock label="Промпт изображения" value={card.generatedImagePrompt} />
              <TextBlock label="Ошибка генерации" value={card.generatedImageError} />
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [product, setProduct] = useState<AdminProductId>("marketcard");
  const [path, setPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState<AdminCardDetail | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<AdminDemoDetail | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<AdminStoryDetail | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  const productConfig = ADMIN_PRODUCTS[product];
  const isStoryStudio = product === "storystudio";

  useEffect(() => {
    const stored = readStoredProduct();
    setProduct(stored);
    setPath(ADMIN_PRODUCTS[stored].defaultHeatmapPath);
  }, []);

  async function load(nextPath = path, nextProduct = product) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/stats?product=${encodeURIComponent(nextProduct)}&path=${encodeURIComponent(nextPath)}`,
        { cache: "no-store" }
      );
      const data = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/admin/login");
          return;
        }
        throw new Error(data.error || "Не удалось загрузить статистику");
      }

      if (!data.overview || !data.funnel7d) {
        throw new Error("Админка вернула пустой ответ. Попробуйте войти заново.");
      }

      setStats(data as AdminStats);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (product) void load(path, product);
  }, [path, product]);

  function handleProductChange(nextProduct: AdminProductId) {
    setProduct(nextProduct);
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, nextProduct);
    setPath(ADMIN_PRODUCTS[nextProduct].defaultHeatmapPath);
  }

  async function openCard(cardId: string) {
    setCardLoading(true);
    setSelectedCard(null);

    try {
      const response = await fetch(`/api/admin/cards/${encodeURIComponent(cardId)}`, { cache: "no-store" });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить карточку");
      }

      setSelectedCard(data as AdminCardDetail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить карточку");
    } finally {
      setCardLoading(false);
    }
  }

  async function openDemo(demoId: string) {
    setDemoLoading(true);
    setSelectedDemo(null);

    try {
      const response = await fetch(`/api/admin/demo-generations/${encodeURIComponent(demoId)}`, { cache: "no-store" });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить демо");
      }

      setSelectedDemo(data as AdminDemoDetail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить демо");
    } finally {
      setDemoLoading(false);
    }
  }

  async function openStory(storyId: string) {
    setStoryLoading(true);
    setSelectedStory(null);

    try {
      const response = await fetch(`/api/admin/stories/${encodeURIComponent(storyId)}`, { cache: "no-store" });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить историю");
      }

      setSelectedStory(data as AdminStoryDetail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить историю");
    } finally {
      setStoryLoading(false);
    }
  }

  if (loading && !stats) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader label="Загружаем админку…" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <Card className="max-w-md text-center" padding="lg">
          <p className="text-lg font-bold text-ink">Доступ запрещён</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Button className="mt-5" onClick={() => router.push("/admin/login")}>
            Войти в админку
          </Button>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const storyOverview = stats.storyStudio?.overview;

  return (
    <AdminShell
      product={productConfig}
      onProductChange={handleProductChange}
      onRefresh={() => load(path, product)}
    >
        <CollapsibleAdminSection
          description={`Ключевые метрики: ${productConfig.label}`}
          icon={<BarChart3 className="text-accent" size={20} />}
          id="overview"
          scope={product}
          title="Обзор"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <Card className="min-w-0" padding="md">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">
                  Пользователи проекта
                </p>
                <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.users}</p>
              </div>
              <Users className="shrink-0 text-accent" size={22} />
            </div>
          </Card>

          {isStoryStudio ? (
            <>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Историй</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{storyOverview?.stories ?? 0}</p>
                  </div>
                  <BookOpen className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Персонажей</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{storyOverview?.characters ?? 0}</p>
                  </div>
                  <Users className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Видео-серий</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{storyOverview?.storyVideos ?? 0}</p>
                  </div>
                  <Clapperboard className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Карточек в БД</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.cards}</p>
                  </div>
                  <BarChart3 className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Демо гостей</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.demoGenerations}</p>
                  </div>
                  <Eye className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
              <Card className="min-w-0" padding="md">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Генераций всего</p>
                    <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.totalGenerations}</p>
                  </div>
                  <MousePointerClick className="shrink-0 text-accent" size={22} />
                </div>
              </Card>
            </>
          )}

          <Card className="min-w-0" padding="md">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Событий за 7 дней</p>
                <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.events7d}</p>
              </div>
              <BarChart3 className="shrink-0 text-accent" size={22} />
            </div>
          </Card>
          </div>
        </CollapsibleAdminSection>

        <LiveVisitorsPanel product={product} />

        <SessionDurationPanel product={product} stats={stats.sessionDuration} />

        {!isStoryStudio && stats ? <DemoErrorsPanel errors={stats.recentDemoErrors ?? []} product={product} /> : null}

        <CollapsibleAdminSection
          description={
            isStoryStudio
              ? `Пользователи с историями в ${productConfig.label}`
              : `Пользователи с карточками или демо в ${productConfig.label}`
          }
          icon={<Users className="text-accent" size={20} />}
          id="recent-users"
          scope={product}
          title="Последние пользователи"
        >
          <div className="grid gap-3 md:hidden">
            {stats.recentUsers.map((user) => (
              <div className="rounded-card border border-clay bg-paper/40 p-4" key={user.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{user.name || "—"}</p>
                    <p className="mt-1 break-all text-sm text-muted">{formatAccountEmail(user.email)}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      Email: {getEmailVerificationLabel(user)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-button bg-accent/10 px-3 py-1 text-sm font-black text-accent">
                    {isStoryStudio
                      ? `${user.projectStoriesCount ?? 0} истор.`
                      : `${user.projectCardsCount ?? 0} карт. / ${user.projectDemosCount ?? 0} демо`}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-muted">
                  {user.lastProjectActivityAt
                    ? `Активность: ${new Date(user.lastProjectActivityAt).toLocaleDateString("ru-RU")}`
                    : `Регистрация: ${new Date(user.createdAt).toLocaleDateString("ru-RU")}`}
                </p>
              </div>
            ))}
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted">Пока нет пользователей с активностью в этом проекте.</p>
            ) : null}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-clay text-muted">
                  <th className="px-3 py-2 font-semibold">Имя</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Статус email</th>
                  <th className="px-3 py-2 font-semibold">{isStoryStudio ? "Историй" : "Активность"}</th>
                  <th className="px-3 py-2 font-semibold">Квота</th>
                  <th className="px-3 py-2 font-semibold">Последняя активность</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((user) => (
                  <tr className="border-b border-clay/70" key={user.id}>
                    <td className="px-3 py-3 font-medium text-ink">{user.name || "—"}</td>
                    <td className="px-3 py-3 text-muted">{formatAccountEmail(user.email)}</td>
                    <td className="px-3 py-3 text-muted">{getEmailVerificationLabel(user)}</td>
                    <td className="px-3 py-3 text-muted">
                      {isStoryStudio
                        ? user.projectStoriesCount ?? 0
                        : `${user.projectCardsCount ?? 0} карт. / ${user.projectDemosCount ?? 0} демо`}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {user.generationsUsed}/{user.generationCredits}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {user.lastProjectActivityAt
                        ? new Date(user.lastProjectActivityAt).toLocaleDateString("ru-RU")
                        : new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
                {stats.recentUsers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-muted" colSpan={6}>
                      Пока нет пользователей с активностью в этом проекте.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CollapsibleAdminSection>

        <Funnel7dPanel onRefresh={() => load(path, product)} product={product} steps={stats.funnel7d} />

        <UserJourneysMapPanel
          heatmap={stats.heatmap}
          journeys={stats.userJourneys}
          journeyZones={productConfig.journeyZones}
          onPathChange={setPath}
          paths={productConfig.heatmapPaths}
          scope={product}
          selectedPath={path}
          topClicks={stats.topClicks}
        />

        <CollapsibleAdminSection
          description="Динамика за последние дни"
          icon={<BarChart3 className="text-accent" size={20} />}
          id="charts-daily"
          scope={product}
          title="Графики по дням"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <MiniBars label="Регистрации по дням" rows={stats.signupsByDay} />
            <MiniBars label={isStoryStudio ? "События генерации по дням" : "Генерации по дням"} rows={stats.generationsByDay} />
          </div>
        </CollapsibleAdminSection>

        {isStoryStudio ? (
          <CollapsibleAdminSection
            badge={
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
                {stats.storyStudio?.recentStories.length ?? 0} последних
              </span>
            }
            description="Нажмите на историю, чтобы увидеть ввод пользователя, персонажей с фото, главы и связи"
            icon={<BookOpen className="text-accent" size={20} />}
            id="recent-stories"
            scope={product}
            title="Последние истории"
          >
            <div className="grid gap-3">
              {(stats.storyStudio?.recentStories ?? []).map((story) => (
                <button
                  className="grid gap-3 rounded-card border border-clay bg-paper/40 p-4 text-left transition hover:border-accent/45 hover:bg-paper md:grid-cols-[1fr_auto] md:items-center"
                  key={story.id}
                  onClick={() => void openStory(story.id)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{story.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{story.premise}</p>
                    <p className="mt-1 text-sm text-muted">
                      {story.genres.join(", ")} · {story.userEmail ? formatAccountEmail(story.userEmail) : "Вход через соцсеть — email не указан"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {new Date(story.updatedAt).toLocaleString("ru-RU")} · {story.charactersCount} перс. · {story.chaptersCount} гл. · {story.episodesCount} серий
                      {story.premiumMode ? " · Премиум 18+" : ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center gap-2 rounded-button border border-clay bg-card px-4 py-2 text-sm font-bold text-ink">
                    <Eye size={16} />
                    Смотреть
                  </span>
                </button>
              ))}
              {!stats.storyStudio?.recentStories.length ? (
                <p className="text-sm text-muted">Историй пока нет</p>
              ) : null}
            </div>
          </CollapsibleAdminSection>
        ) : (
          <>
        <CollapsibleAdminSection
          badge={
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
              {stats.recentDemos.length} последних
            </span>
          }
          description="Фото, ввод пользователя и оценка даже без регистрации"
          icon={<Eye className="text-accent" size={20} />}
          id="recent-demos"
          scope={product}
          title="Демо-генерации гостей"
        >
          <div className="grid gap-3">
            {stats.recentDemos.map((demo) => (
              <button
                className="grid gap-3 rounded-card border border-clay bg-paper/40 p-4 text-left transition hover:border-accent/45 hover:bg-paper md:grid-cols-[1fr_auto] md:items-center"
                key={demo.id}
                onClick={() => void openDemo(demo.id)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{demo.title || "Демо без названия"}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{demo.productDescription}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {new Date(demo.createdAt).toLocaleString("ru-RU")} · {demo.userEmail ? formatAccountEmail(demo.userEmail) : `гость ${demo.guestId.slice(0, 8)}`} · {demo.provider || "provider unknown"}
                  </p>
                  <div className="mt-2">
                    <RatingValue rating={demo.generationRating} />
                  </div>
                </div>
                <span className="inline-flex items-center justify-center gap-2 rounded-button border border-clay bg-card px-4 py-2 text-sm font-bold text-ink">
                  <Eye size={16} />
                  Смотреть
                </span>
              </button>
            ))}
            {!stats.recentDemos.length ? <p className="text-sm text-muted">Демо-генераций пока нет</p> : null}
          </div>
        </CollapsibleAdminSection>

        <CollapsibleAdminSection
          badge={
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
              {stats.recentCards.length} последних
            </span>
          }
          description="Нажмите на карточку, чтобы сравнить загрузку пользователя и результат генерации"
          icon={<Film className="text-accent" size={20} />}
          id="recent-cards"
          scope={product}
          title="Последние карточки пользователей"
        >
          <div className="grid gap-3">
            {stats.recentCards.map((card) => (
              <button
                className="grid gap-3 rounded-card border border-clay bg-paper/40 p-4 text-left transition hover:border-accent/45 hover:bg-paper md:grid-cols-[1fr_auto] md:items-center"
                key={card.id}
                onClick={() => void openCard(card.id)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{card.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {card.marketplace} · {card.category} · {card.userEmail ? formatAccountEmail(card.userEmail) : "email не найден"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {new Date(card.createdAt).toLocaleString("ru-RU")}
                    {card.videoCount > 0 ? ` · ${card.videoCount} видео` : ""}
                  </p>
                  <div className="mt-2">
                    <RatingValue rating={card.generationRating} />
                  </div>
                </div>
                <span className="inline-flex items-center justify-center gap-2 rounded-button border border-clay bg-card px-4 py-2 text-sm font-bold text-ink">
                  {card.videoCount > 0 ? <Film size={16} /> : <Eye size={16} />}
                  Смотреть
                </span>
              </button>
            ))}
            {!stats.recentCards.length ? <p className="text-sm text-muted">Карточки еще не сохранены</p> : null}
          </div>
        </CollapsibleAdminSection>
          </>
        )}
      <CardDetailModal
        detail={selectedCard}
        loading={cardLoading}
        onClose={() => {
          setSelectedCard(null);
          setCardLoading(false);
        }}
      />
      <DemoDetailModal
        detail={selectedDemo}
        loading={demoLoading}
        onClose={() => {
          setSelectedDemo(null);
          setDemoLoading(false);
        }}
      />
      <StoryDetailModal
        detail={selectedStory}
        loading={storyLoading}
        onClose={() => {
          setSelectedStory(null);
          setStoryLoading(false);
        }}
      />
    </AdminShell>
  );
}
