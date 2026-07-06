"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, MousePointerClick, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatAccountEmail } from "@/lib/auth/email-utils";

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

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [path, setPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    </div>
  );
}
