"use client";

import { useMemo, useState } from "react";
import { ArrowRight, MapPin, MousePointerClick, Route, X } from "lucide-react";
import { CollapsibleAdminSection } from "@/components/admin/CollapsibleAdminSection";
import { getPathLabel } from "@/lib/presence/labels";

export type UserJourney = {
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
};

type HeatmapPoint = { x: number; y: number; count: number };

type Props = {
  journeys: UserJourney[];
  heatmap: HeatmapPoint[];
  topClicks: { label: string; count: number }[];
  paths: string[];
  selectedPath: string;
  onPathChange: (path: string) => void;
};

const PAGE_ZONES = [
  { id: "/", label: "Главная" },
  { id: "/login", label: "Вход" },
  { id: "/register", label: "Регистрация" },
  { id: "/cabinet", label: "Кабинет" },
  { id: "/admin", label: "Админка" },
  { id: "/generations", label: "Демо" }
] as const;

function normalizePath(path: string) {
  const pathname = path.split("#")[0] || "/";
  if (pathname.startsWith("/admin")) return "/admin";
  if (pathname.startsWith("/cabinet")) return "/cabinet";
  if (pathname.startsWith("/generations/")) return "/generations";
  return pathname;
}

function getJourneyLabel(journey: UserJourney) {
  if (journey.guestId) return `Гость ${journey.guestId.slice(0, 8)}`;
  if (journey.userId) return `User ${journey.userId.slice(0, 8)}`;
  return `Сессия ${journey.sessionId.slice(0, 8)}`;
}

function getLastPath(journey: UserJourney) {
  const lastEventPath = [...journey.events].reverse().find((event) => event.path)?.path;
  if (lastEventPath) return normalizePath(lastEventPath);
  if (journey.paths[0]) return normalizePath(journey.paths[0]);
  return "/";
}

function buildPathTransitions(journeys: UserJourney[]) {
  const transitions = new Map<string, number>();

  for (const journey of journeys) {
    const orderedPaths = journey.events
      .filter((event) => event.eventType === "page_view")
      .map((event) => normalizePath(event.path));

    for (let index = 0; index < orderedPaths.length - 1; index += 1) {
      const from = orderedPaths[index];
      const to = orderedPaths[index + 1];
      if (from === to) continue;
      const key = `${from}→${to}`;
      transitions.set(key, (transitions.get(key) ?? 0) + 1);
    }
  }

  return [...transitions.entries()]
    .map(([key, count]) => {
      const [from, to] = key.split("→");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function ClickHeatmap({ points }: { points: HeatmapPoint[] }) {
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
        <div className="grid h-full place-items-center px-4 text-center text-sm font-medium text-muted">
          Пока нет кликов для этой страницы
        </div>
      ) : null}
    </div>
  );
}

function JourneyDetail({ journey, onClose }: { journey: UserJourney; onClose: () => void }) {
  return (
    <div className="rounded-card border border-accent/30 bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-accent">Сессия пользователя</p>
          <h3 className="mt-1 truncate text-lg font-black text-ink">{getJourneyLabel(journey)}</h3>
          <p className="mt-1 text-xs font-semibold text-muted">
            {new Date(journey.firstSeenAt).toLocaleString("ru-RU")} → {new Date(journey.lastSeenAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-clay hover:bg-paper"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-ink">
        <span className="rounded-full bg-paper px-3 py-1">Заходы: {journey.pageViews}</span>
        <span className="rounded-full bg-paper px-3 py-1">Клики: {journey.clicks}</span>
        <span className="rounded-full bg-paper px-3 py-1">События: {journey.conversions}</span>
      </div>

      {journey.currentPathLabel || journey.lastActionLabel ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {journey.currentPathLabel ? (
            <div className="rounded-[14px] border border-clay bg-paper/50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">Сейчас на странице</p>
              <p className="mt-1 text-sm font-semibold text-ink">{journey.currentPathLabel}</p>
            </div>
          ) : null}
          {journey.lastActionLabel ? (
            <div className="rounded-[14px] border border-clay bg-paper/50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">Последнее действие</p>
              <p className="mt-1 text-sm font-semibold text-ink">{journey.lastActionLabel}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {journey.paths.map((pathItem) => (
          <span className="rounded-full border border-clay bg-paper px-3 py-1 text-xs font-semibold text-muted" key={pathItem}>
            {pathItem}
          </span>
        ))}
      </div>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {journey.events.map((event) => (
          <div
            className="grid gap-1 rounded-[12px] border border-clay/70 bg-paper/50 px-3 py-2 text-xs sm:grid-cols-[130px_1fr_auto]"
            key={`${journey.sessionId}-${event.createdAt}-${event.eventName}`}
          >
            <span className="font-black text-accent">{event.eventName}</span>
            <span className="min-w-0 break-words text-muted">{event.label || event.path}</span>
            <span className="text-muted">{new Date(event.createdAt).toLocaleTimeString("ru-RU")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserJourneysMapPanel({ journeys, heatmap, topClicks, paths, selectedPath, onPathChange }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const journeysByZone = useMemo(() => {
    const grouped = new Map<string, UserJourney[]>();

    for (const zone of PAGE_ZONES) {
      grouped.set(zone.id, []);
    }

    for (const journey of journeys) {
      const zoneId = getLastPath(journey);
      const bucket = grouped.get(zoneId) ?? grouped.get("/") ?? [];
      bucket.push(journey);
      grouped.set(zoneId, bucket);
    }

    return grouped;
  }, [journeys]);

  const transitions = useMemo(() => buildPathTransitions(journeys), [journeys]);
  const selectedJourney = journeys.find((journey) => journey.sessionId === selectedSessionId) ?? null;
  const totalClicks = journeys.reduce((sum, journey) => sum + journey.clicks, 0);

  return (
    <CollapsibleAdminSection
      badge={
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">{journeys.length}</span>
      }
      description="Карта кликов и перемещений по сайту. Нажмите на пользователя, чтобы открыть его сессию."
      icon={<Route className="text-accent" size={20} />}
      id="user-journeys"
      title="Пути пользователей"
    >
      <div className="mb-5 flex justify-end">
        <select
          className="min-h-11 rounded-button border border-clay bg-paper px-4 py-2 text-sm font-semibold text-ink outline-none focus:border-accent/60"
          onChange={(event) => onPathChange(event.target.value)}
          value={selectedPath}
        >
          {paths.map((path) => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted">Карта кликов — {selectedPath}</p>
          <ClickHeatmap points={heatmap} />
          <p className="mt-2 text-xs font-semibold text-muted">
            Совокупность кликов всех пользователей за 30 дней на выбранной странице
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted">Популярные клики</p>
            <div className="space-y-2">
              {topClicks.slice(0, 6).map((item) => (
                <div className="flex items-start justify-between gap-3 rounded-[14px] border border-clay bg-paper/40 px-3 py-2 text-sm" key={`${item.label}-${item.count}`}>
                  <span className="min-w-0 break-words font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 font-black text-accent">{item.count}</span>
                </div>
              ))}
              {!topClicks.length ? <p className="text-sm text-muted">Клики ещё не собраны</p> : null}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted">Переходы между страницами</p>
            <div className="space-y-2">
              {transitions.map((transition) => (
                <div className="flex items-center gap-2 rounded-[14px] border border-clay bg-paper/40 px-3 py-2 text-xs font-semibold text-ink" key={`${transition.from}-${transition.to}`}>
                  <span>{getPathLabel(transition.from)}</span>
                  <ArrowRight className="shrink-0 text-accent" size={14} />
                  <span>{getPathLabel(transition.to)}</span>
                  <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 font-black text-accent">{transition.count}</span>
                </div>
              ))}
              {!transitions.length ? <p className="text-sm text-muted">Переходов пока нет</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Где сейчас пользователи</p>
          <p className="text-xs font-semibold text-muted">
            <MousePointerClick className="mr-1 inline" size={13} />
            {totalClicks} кликов в выбранных сессиях
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PAGE_ZONES.map((zone) => {
            const zoneJourneys = journeysByZone.get(zone.id) ?? [];

            return (
              <div className="rounded-card border border-clay bg-paper/40 p-3" key={zone.id}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
                    <MapPin size={14} className="text-accent" />
                    {zone.label}
                  </span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-black text-muted">{zoneJourneys.length}</span>
                </div>
                <div className="flex min-h-16 flex-wrap gap-2">
                  {zoneJourneys.map((journey) => {
                    const isSelected = selectedSessionId === journey.sessionId;
                    const intensity = Math.min(1, journey.clicks / 20);

                    return (
                      <button
                        className={`rounded-full border px-3 py-1.5 text-left text-xs font-bold transition ${
                          isSelected
                            ? "border-accent bg-accent/15 text-ink ring-2 ring-accent/25"
                            : "border-clay bg-card text-ink hover:border-accent/45 hover:bg-accent/10"
                        }`}
                        key={journey.sessionId}
                        onClick={() => setSelectedSessionId(journey.sessionId)}
                        style={{
                          boxShadow: isSelected ? undefined : `0 0 0 ${1 + intensity * 2}px rgba(124,255,107,${0.08 + intensity * 0.12})`
                        }}
                        title={`${journey.clicks} кликов · ${journey.pageViews} заходов`}
                        type="button"
                      >
                        {getJourneyLabel(journey)}
                      </button>
                    );
                  })}
                  {!zoneJourneys.length ? <p className="text-xs font-semibold text-muted">Никого</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedJourney ? (
        <div className="mt-5">
          <JourneyDetail journey={selectedJourney} onClose={() => setSelectedSessionId(null)} />
        </div>
      ) : (
        <p className="mt-5 text-sm font-semibold text-muted">Выберите пользователя на карте, чтобы посмотреть его путь по сайту.</p>
      )}
    </CollapsibleAdminSection>
  );
}
