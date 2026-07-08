"use client";

import { Clock3, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDurationLabel, type SessionDurationStats } from "@/lib/server/session-duration";

type Props = {
  stats: SessionDurationStats;
};

export function SessionDurationPanel({ stats }: Props) {
  const max = Math.max(1, ...stats.buckets.map((bucket) => bucket.value));

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="text-accent" size={20} />
            <h2 className="text-lg font-bold text-ink">Время на сайте</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Сколько времени проводят посетители за последние {stats.periodDays} дней
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-clay bg-paper px-3 py-1.5 text-xs font-black text-ink">
            Сессий: {stats.totalSessions}
          </span>
          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-black text-accent">
            Среднее: {formatDurationLabel(stats.averageSeconds)}
          </span>
          <span className="rounded-full bg-mint/10 px-3 py-1.5 text-xs font-black text-mint">
            Медиана: {formatDurationLabel(stats.medianSeconds)}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted">Распределение по интервалам по 10 минут</p>
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
        {!stats.totalSessions ? (
          <p className="mt-4 text-sm text-muted">Пока недостаточно данных о сессиях посетителей</p>
        ) : null}
      </div>
    </Card>
  );
}
