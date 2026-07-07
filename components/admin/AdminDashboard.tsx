"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Eye, LogOut, MousePointerClick, RefreshCw, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatAccountEmail } from "@/lib/auth/email-utils";
import type { ProductCardResult } from "@/types/product-card";

type AdminStats = {
  overview: {
    users: number;
    cards: number;
    totalGenerations: number;
    events7d: number;
  };
  funnel: {
    pageViews: number;
    ctaClicks: number;
    registrations: number;
    logins: number;
    generations: number;
    paywallViews: number;
    paymentClicks: number;
  };
  heatmap: { x: number; y: number; count: number }[];
  topClicks: { label: string; count: number }[];
  signupsByDay: { day: string; value: number }[];
  generationsByDay: { day: string; value: number }[];
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    generationsUsed: number;
    generationCredits: number;
    createdAt: Date;
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

const PATHS = ["/", "/login", "/register", "/cabinet"];

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
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

function Heatmap({ points }: { points: AdminStats["heatmap"] }) {
  const max = useMemo(() => Math.max(1, ...points.map((point) => point.count)), [points]);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-clay bg-paper sm:aspect-[16/10]">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.03),transparent)]" />
      {points.map((point) => (
        <span
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
          key={`${point.x}-${point.y}-${point.count}`}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            opacity: Math.min(0.9, 0.2 + point.count / max),
            background: `radial-gradient(circle, rgba(255,107,74,${0.25 + point.count / max}) 0%, rgba(255,107,74,0) 70%)`,
            transform: `translate(-50%, -50%) scale(${0.8 + point.count / max})`
          }}
          title={`${point.count} кликов`}
        />
      ))}
      {!points.length ? (
        <div className="grid h-full place-items-center text-sm font-medium text-muted">Пока нет кликов для этой страницы</div>
      ) : null}
    </div>
  );
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

function getCardImage(card: ProductCardResult) {
  if (card.generatedImageUrl) return card.generatedImageUrl;
  if (card.generatedImageDataUrl) return card.generatedImageDataUrl;
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return `data:${card.generatedImageMimeType};base64,${card.generatedImageBase64}`;
  }
  return card.imageDataUrl || null;
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
  const imageUrl = card ? getCardImage(card) : null;

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
              <div className="overflow-hidden rounded-card border border-clay bg-paper">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={card.title} className="aspect-[4/5] w-full object-cover" src={imageUrl} />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center text-sm font-semibold text-muted">Нет изображения</div>
                )}
              </div>
              <div className="grid gap-3">
                <DetailField label="Пользователь" value={detail.userName || "Без имени"} />
                <DetailField label="Email" value={detail.userEmail ? formatAccountEmail(detail.userEmail) : "Нет email"} />
                <DetailField label="Дата" value={new Date(detail.createdAt).toLocaleString("ru-RU")} />
                <DetailField label="Провайдер" value={card.generatedImageProvider || card.provider} />
                <DetailField label="Fallback" value={card.generatedImageIsFallback ?? card.isFallback} />
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

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [path, setPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState<AdminCardDetail | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  async function load(nextPath = path) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/stats?path=${encodeURIComponent(nextPath)}`, { cache: "no-store" });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/admin/login");
          return;
        }
        throw new Error(data.error || "Не удалось загрузить статистику");
      }

      if (!data.overview || !data.funnel) {
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
    void load(path);
  }, [path]);

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

  const funnel = [
    ["Просмотры", stats.funnel.pageViews],
    ["CTA клики", stats.funnel.ctaClicks],
    ["Регистрации", stats.funnel.registrations],
    ["Входы", stats.funnel.logins],
    ["Генерации", stats.funnel.generations],
    ["Paywall", stats.funnel.paywallViews],
    ["Оплата", stats.funnel.paymentClicks]
  ] as const;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-clay bg-card/90 px-4 py-4 backdrop-blur-xl sm:px-5 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-accent sm:text-xs sm:tracking-[0.18em]">Admin</p>
            <h1 className="mt-1 text-xl font-black leading-tight text-ink sm:text-2xl">Аналитика MarketCard AI</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={() => load(path)} size="sm" variant="secondary">
              <RefreshCw size={16} />
              Обновить
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                router.push("/admin/login");
              }}
              size="sm"
              variant="ghost"
            >
              <LogOut size={16} />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-5 lg:space-y-6 lg:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Card className="min-w-0" padding="md">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Пользователи</p>
                <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.users}</p>
              </div>
              <Users className="shrink-0 text-accent" size={22} />
            </div>
          </Card>
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
                <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.18em]">Генераций всего</p>
                <p className="mt-2 text-2xl font-black text-ink sm:text-3xl">{stats.overview.totalGenerations}</p>
              </div>
              <MousePointerClick className="shrink-0 text-accent" size={22} />
            </div>
          </Card>
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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card padding="lg">
            <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Тепловая карта кликов</h2>
                <p className="mt-1 text-sm text-muted">Агрегация кликов за 30 дней</p>
              </div>
              <select
                className="min-h-11 w-full rounded-button border border-clay bg-paper px-4 py-2 text-sm font-semibold text-ink outline-none focus:border-accent/60 sm:w-auto"
                onChange={(event) => setPath(event.target.value)}
                value={path}
              >
                {PATHS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5">
              <Heatmap points={stats.heatmap} />
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-lg font-bold text-ink">Воронка конверсий</h2>
            <p className="mt-1 text-sm text-muted">За последние 30 дней</p>
            <div className="mt-5 space-y-3">
              {funnel.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">{label}</span>
                    <span className="shrink-0 text-muted">
                      {value} · {pct(value, stats.funnel.pageViews || value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-paper">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: pct(value, Math.max(stats.funnel.pageViews, value)) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <h2 className="text-lg font-bold text-ink">Топ кликов</h2>
            <div className="mt-4 space-y-2">
              {stats.topClicks.map((item) => (
                <div className="flex items-start justify-between gap-3 rounded-[14px] border border-clay px-4 py-3 text-sm" key={`${item.label}-${item.count}`}>
                  <span className="min-w-0 break-words font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 font-black text-accent">{item.count}</span>
                </div>
              ))}
              {!stats.topClicks.length ? <p className="text-sm text-muted">Клики ещё не собраны</p> : null}
            </div>
          </Card>

          <Card padding="lg">
            <div className="grid gap-6 md:grid-cols-2">
              <MiniBars label="Регистрации по дням" rows={stats.signupsByDay} />
              <MiniBars label="Генерации по дням" rows={stats.generationsByDay} />
            </div>
          </Card>
        </div>

        <Card padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Последние карточки пользователей</h2>
              <p className="mt-1 text-sm text-muted">Нажмите на карточку, чтобы увидеть результат и исходные вводные</p>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
              {stats.recentCards.length} последних
            </span>
          </div>
          <div className="mt-4 grid gap-3">
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
                  </p>
                </div>
                <span className="inline-flex items-center justify-center gap-2 rounded-button border border-clay bg-card px-4 py-2 text-sm font-bold text-ink">
                  <Eye size={16} />
                  Смотреть
                </span>
              </button>
            ))}
            {!stats.recentCards.length ? <p className="text-sm text-muted">Карточки еще не сохранены</p> : null}
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-ink">Последние пользователи</h2>
          <p className="mt-1 text-sm text-muted">Email и квота сохраняются в SQLite</p>
          <div className="mt-4 grid gap-3 md:hidden">
            {stats.recentUsers.map((user) => (
              <div className="rounded-card border border-clay bg-paper/40 p-4" key={user.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{user.name || "—"}</p>
                    <p className="mt-1 break-all text-sm text-muted">{formatAccountEmail(user.email)}</p>
                  </div>
                  <span className="shrink-0 rounded-button bg-accent/10 px-3 py-1 text-sm font-black text-accent">
                    {user.generationsUsed}/{user.generationCredits}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-muted">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-clay text-muted">
                  <th className="px-3 py-2 font-semibold">Имя</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Генерации</th>
                  <th className="px-3 py-2 font-semibold">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((user) => (
                  <tr className="border-b border-clay/70" key={user.id}>
                    <td className="px-3 py-3 font-medium text-ink">{user.name || "—"}</td>
                    <td className="px-3 py-3 text-muted">{formatAccountEmail(user.email)}</td>
                    <td className="px-3 py-3 text-muted">
                      {user.generationsUsed}/{user.generationCredits}
                    </td>
                    <td className="px-3 py-3 text-muted">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
      <CardDetailModal
        detail={selectedCard}
        loading={cardLoading}
        onClose={() => {
          setSelectedCard(null);
          setCardLoading(false);
        }}
      />
    </div>
  );
}
