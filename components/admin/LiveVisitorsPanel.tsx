"use client";

import { useEffect, useState } from "react";
import { Activity, Eye, EyeOff, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type LiveVisitor = {
  sessionId: string;
  displayName: string;
  pathLabel: string;
  sectionLabel: string;
  lastActionLabel: string;
  isAuthed: boolean;
  isVisible: boolean;
  lastSeenAt: string;
  firstSeenAt: string;
};

type LivePresence = {
  activeCount: number;
  activeWindowSec: number;
  visitors: LiveVisitor[];
  sections: { label: string; count: number }[];
};

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const seconds = Math.max(0, Math.round(diffMs / 1000));

  if (seconds < 60) return `${seconds} сек назад`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} мин назад`;
}

function formatDuration(start: string, end: string) {
  const diffMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  const minutes = Math.floor(diffMs / 60_000);
  const seconds = Math.round((diffMs % 60_000) / 1000);

  if (minutes > 0) return `${minutes} мин ${seconds} сек`;
  return `${seconds} сек`;
}

export function LiveVisitorsPanel() {
  const [data, setData] = useState<LivePresence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/admin/presence", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось загрузить онлайн-посетителей");
      }

      setData(payload as LivePresence);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 10_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-mint" size={20} />
            <h2 className="text-lg font-bold text-ink">Сейчас на сайте</h2>
            <span className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-black text-mint">
              {data?.activeCount ?? 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Активны за последние {data?.activeWindowSec ?? 90} секунд. Обновление каждые 10 секунд.
          </p>
        </div>
        <Button onClick={() => void load()} size="sm" variant="secondary">
          <RefreshCw size={16} />
          Обновить
        </Button>
      </div>

      {data?.sections.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {data.sections.map((section) => (
            <span
              className="rounded-full border border-clay bg-paper px-3 py-1.5 text-xs font-bold text-ink"
              key={section.label}
            >
              {section.label}: {section.count}
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm font-semibold text-accent">{error}</p> : null}

      <div className="mt-5 overflow-x-auto rounded-[18px] border border-clay">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper/60 text-xs font-black uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Посетитель</th>
              <th className="px-4 py-3">Страница</th>
              <th className="px-4 py-3">Блок</th>
              <th className="px-4 py-3">Действие</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">На сайте</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  Загружаем посетителей…
                </td>
              </tr>
            ) : null}
            {!loading && !data?.visitors.length ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  Сейчас никого нет на сайте
                </td>
              </tr>
            ) : null}
            {data?.visitors.map((visitor) => (
              <tr className="border-t border-clay" key={visitor.sessionId}>
                <td className="px-4 py-3">
                  <p className="font-bold text-ink">{visitor.displayName}</p>
                  <p className="mt-1 text-xs text-muted">{visitor.isAuthed ? "Авторизован" : "Гость"}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-ink">{visitor.pathLabel}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                    <MapPin size={14} />
                    {visitor.sectionLabel}
                  </span>
                </td>
                <td className="max-w-xs px-4 py-3 font-semibold text-muted">
                  <p className="break-words">{visitor.lastActionLabel}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      visitor.isVisible ? "bg-mint/15 text-mint" : "bg-paper text-muted"
                    }`}
                  >
                    {visitor.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {visitor.isVisible ? "На вкладке" : "В фоне"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  <p>{formatRelativeTime(visitor.lastSeenAt)}</p>
                  <p className="mt-1 text-xs">{formatDuration(visitor.firstSeenAt, visitor.lastSeenAt)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
