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

function Heatmap({ points }: { points: AdminStats["heatmap"] }) {
  const max = useMemo(() => Math.max(1, ...points.map((point) => point.count)), [points]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-clay bg-paper">
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
      <div className="flex h-28 items-end gap-1">
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
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/admin/login");
          return;
        }
        throw new Error(data.error || "Не удалось загрузить статистику");
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
      <header className="border-b border-clay bg-card/80 px-5 py-4 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Admin</p>
            <h1 className="text-2xl font-black text-ink">Аналитика MarketCard AI</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => load(path)} size="sm" variant="secondary">
              <RefreshCw size={16} />
              Обновить
            </Button>
            <Button
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

      <main className="mx-auto max-w-7xl space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Пользователи</p>
                <p className="mt-2 text-3xl font-black text-ink">{stats.overview.users}</p>
              </div>
              <Users className="text-accent" size={22} />
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Карточек в БД</p>
                <p className="mt-2 text-3xl font-black text-ink">{stats.overview.cards}</p>
              </div>
              <BarChart3 className="text-accent" size={22} />
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Генераций всего</p>
                <p className="mt-2 text-3xl font-black text-ink">{stats.overview.totalGenerations}</p>
              </div>
              <MousePointerClick className="text-accent" size={22} />
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Событий за 7 дней</p>
                <p className="mt-2 text-3xl font-black text-ink">{stats.overview.events7d}</p>
              </div>
              <BarChart3 className="text-accent" size={22} />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Тепловая карта кликов</h2>
                <p className="mt-1 text-sm text-muted">Агрегация кликов за 30 дней</p>
              </div>
              <select
                className="rounded-full border border-clay bg-paper px-4 py-2 text-sm font-semibold text-ink"
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
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{label}</span>
                    <span className="text-muted">
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
                <div className="flex items-center justify-between rounded-[14px] border border-clay px-4 py-3 text-sm" key={`${item.label}-${item.count}`}>
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="font-black text-accent">{item.count}</span>
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
          <div className="mt-4 overflow-x-auto">
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
