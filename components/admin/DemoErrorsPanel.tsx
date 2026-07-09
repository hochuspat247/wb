"use client";

import { AlertTriangle } from "lucide-react";
import { CollapsibleAdminSection } from "@/components/admin/CollapsibleAdminSection";

type DemoErrorItem = {
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
};

function formatSource(source: string | null) {
  if (source === "hero") return "Главная";
  if (source === "card_generator") return "Кабинет / демо";
  if (source === "server") return "Сервер";
  return source || "Клиент";
}

export function DemoErrorsPanel({ errors, product = "marketcard" }: { errors: DemoErrorItem[]; product?: string }) {
  return (
    <CollapsibleAdminSection
      badge={
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
          {errors.length}
        </span>
      }
      description="Последние сбои демо-генерации с текстом ошибки"
      icon={<AlertTriangle className="text-accent" size={20} />}
      id="demo-errors"
      scope={product}
      title="Ошибки демо"
    >
      <div className="overflow-x-auto rounded-[18px] border border-clay">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper/60 text-xs font-black uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Ошибка</th>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Источник</th>
              <th className="px-4 py-3">Сессия</th>
            </tr>
          </thead>
          <tbody>
            {!errors.length ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  Ошибок демо пока нет
                </td>
              </tr>
            ) : null}
            {errors.map((error) => (
              <tr className="border-t border-clay align-top" key={error.id}>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {new Date(error.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-xl break-words font-semibold text-ink">{error.message}</p>
                  <p className="mt-1 text-xs text-muted">{error.path}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {error.code || "—"}
                  {error.status ? ` · ${error.status}` : ""}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatSource(error.source)}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  <p>{error.guestId ? `Гость ${error.guestId.slice(0, 8)}` : `Сессия ${error.sessionId.slice(0, 8)}`}</p>
                  {error.userId ? <p className="mt-1">user: {error.userId.slice(0, 8)}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleAdminSection>
  );
}
