"use client";

import { ExternalLink } from "lucide-react";
import {
  WB_API_INTEGRATIONS_URL,
  WB_API_NEW_ACCESS_URL,
  WB_CONNECT_REQUIREMENTS,
  WB_CONNECT_STEPS,
  WB_SELLER_CABINET_URL
} from "@/lib/wildberries/connectGuide";

type WildberriesConnectGuideProps = {
  compact?: boolean;
  className?: string;
  onOpenSettings?: () => void;
};

export function WildberriesConnectGuide({
  compact = false,
  className = "",
  onOpenSettings
}: WildberriesConnectGuideProps) {
  return (
    <div
      className={`rounded-[18px] border border-[#CB11AB]/20 bg-[linear-gradient(160deg,rgba(203,17,171,0.08),rgba(255,255,255,0.02))] ${
        compact ? "p-4" : "p-5 sm:p-6"
      } ${className}`.trim()}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Инструкция для селлера</p>
      <h3 className={`mt-2 font-black text-ink ${compact ? "text-base" : "text-lg"}`}>
        Как подключить аккаунт Wildberries
      </h3>
      <p className={`mt-2 font-semibold leading-relaxed text-muted ${compact ? "text-xs" : "text-sm"}`}>
        Нужен API-токен из личного кабинета WB. Подключение занимает 2–3 минуты.
      </p>

      <div className={`mt-4 grid gap-2 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
        {WB_CONNECT_REQUIREMENTS.map((item) => (
          <div className="rounded-[14px] border border-clay bg-card/70 px-3 py-2 text-xs font-semibold text-muted" key={item}>
            {item}
          </div>
        ))}
      </div>

      <ol className={`mt-5 space-y-4 ${compact ? "text-sm" : ""}`}>
        {WB_CONNECT_STEPS.map((step, index) => (
          <li className="flex gap-3" key={step.title}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#CB11AB]/12 text-xs font-black text-[#CB11AB]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-black text-ink">{step.title}</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">{step.text}</p>
              {"href" in step && step.href ? (
                <a
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-[#CB11AB] underline-offset-2 hover:underline"
                  href={step.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink size={14} />
                  {step.linkLabel}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-button border border-[#CB11AB] bg-[#CB11AB] px-4 text-sm font-semibold text-white transition hover:-translate-y-px"
          href={WB_API_INTEGRATIONS_URL}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={15} />
          Создать токен в WB
        </a>
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-button border border-clay bg-card px-4 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
          href={WB_SELLER_CABINET_URL}
          rel="noreferrer"
          target="_blank"
        >
          Кабинет seller.wildberries.ru
        </a>
        {onOpenSettings ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-button border border-clay bg-card px-4 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
            onClick={onOpenSettings}
            type="button"
          >
            Вставить токен в настройках
          </button>
        ) : (
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-button border border-clay bg-card px-4 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
            href="/cabinet#settings"
          >
            Вставить токен в настройках
          </a>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold leading-relaxed text-muted">
        Не видите «Интеграции по API»? Попробуйте{" "}
        <a className="font-black text-[#CB11AB] underline-offset-2 hover:underline" href={WB_API_NEW_ACCESS_URL} rel="noreferrer" target="_blank">
          старый раздел «Доступ к новому API»
        </a>
        . Если кнопка «Создать токен» неактивна — войдите под владельцем кабинета WB.
      </p>
    </div>
  );
}
