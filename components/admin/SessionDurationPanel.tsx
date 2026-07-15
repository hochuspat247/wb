"use client";

import { useMemo, useState } from "react";
import { Clock3, Users } from "lucide-react";
import { CollapsibleAdminSection } from "@/components/admin/CollapsibleAdminSection";
import { formatDurationLabel, type SessionDurationStats } from "@/lib/server/session-duration";

type ViewMode = "duration" | "hours";

type Props = {
  stats: SessionDurationStats;
  product?: string;
};

function DurationChart({ stats }: { stats: SessionDurationStats }) {
  const max = Math.max(1, ...stats.buckets.map((bucket) => bucket.value));

  return (
    <>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted">
        Распределение по интервалам по 10 минут
      </p>
      <div className="flex h-52 items-end gap-2 sm:gap-3">
        {stats.buckets.map((bucket) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={bucket.label}>
            <div className="flex h-40 w-full items-end">
              <div
                className="group relative w-full rounded-t-[14px] bg-accent/85 transition hover:bg-accent"
                style={{ height: `${Math.max(8, (bucket.value / max) * 100)}%` }}
                title={`${bucket.label}: ${bucket.value} сессий`}
              >
                {bucket.value > 0 ? (
                  <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-black text-white group-hover:block">
                    {bucket.value}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-black leading-tight text-ink sm:text-xs">{bucket.label}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-muted">
                <Users size={11} />
                {bucket.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ActiveHoursChart({ stats }: { stats: SessionDurationStats }) {
  const max = Math.max(1, ...stats.activeHours.map((bucket) => bucket.value));
  const topHours = useMemo(
    () => [...stats.activeHours].sort((a, b) => b.value - a.value).filter((bucket) => bucket.value > 0).slice(0, 3),
    [stats.activeHours]
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Активность по часам (МСК)</p>
        {topHours.length ? (
          <div className="flex flex-wrap gap-2">
            {topHours.map((bucket) => (
              <span
                className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-black text-accent-ink"
                key={bucket.label}
              >
                {bucket.label} · {bucket.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex h-52 min-w-[760px] items-end gap-1.5 sm:gap-2">
          {stats.activeHours.map((bucket) => (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={bucket.label}>
              <div className="flex h-40 w-full items-end">
                <div
                  className="group relative w-full rounded-t-[12px] bg-mint/80 transition hover:bg-mint"
                  style={{ height: `${Math.max(8, (bucket.value / max) * 100)}%` }}
                  title={`${bucket.label}: ${bucket.value} событий`}
                >
                  {bucket.value > 0 ? (
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-black text-white group-hover:block">
                      {bucket.value}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black leading-tight text-ink sm:text-[11px]">{bucket.label}</p>
                <p className="mt-1 text-[10px] font-semibold text-muted">{bucket.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function SessionDurationPanel({ stats, product = "marketcard" }: Props) {
  const [view, setView] = useState<ViewMode>("duration");
  const hasData = view === "duration" ? stats.totalSessions > 0 : stats.activeHours.some((bucket) => bucket.value > 0);

  return (
    <CollapsibleAdminSection
      description={`Сколько времени проводят посетители и в какие часы они активнее всего за последние ${stats.periodDays} дней`}
      icon={<Clock3 className="text-accent-ink" size={20} />}
      id="session-duration"
      scope={product}
      title="Время на сайте"
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-clay bg-paper px-3 py-1.5 text-xs font-black text-ink">
          Сессий: {stats.totalSessions}
        </span>
        <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-black text-accent-ink">
          Среднее: {formatDurationLabel(stats.averageSeconds)}
        </span>
        <span className="rounded-full bg-mint/10 px-3 py-1.5 text-xs font-black text-accent-ink">
          {stats.peakHourLabel ? `Пик: ${stats.peakHourLabel}` : `Медиана: ${formatDurationLabel(stats.medianSeconds)}`}
        </span>
      </div>

      <div className="inline-flex rounded-full border border-clay bg-paper p-1">
        <button
          className={`rounded-full px-4 py-2 text-xs font-black transition ${
            view === "duration" ? "bg-accent text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
          onClick={() => setView("duration")}
          type="button"
        >
          Длительность
        </button>
        <button
          className={`rounded-full px-4 py-2 text-xs font-black transition ${
            view === "hours" ? "bg-accent text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
          onClick={() => setView("hours")}
          type="button"
        >
          Активные часы
        </button>
      </div>

      <div className="mt-6">
        {view === "duration" ? <DurationChart stats={stats} /> : <ActiveHoursChart stats={stats} />}
        {!hasData ? <p className="mt-4 text-sm text-muted">Пока недостаточно данных о сессиях посетителей</p> : null}
      </div>
    </CollapsibleAdminSection>
  );
}
