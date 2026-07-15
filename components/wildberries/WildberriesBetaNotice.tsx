import { AlertTriangle } from "lucide-react";
import { LEGAL_CONTACT } from "@/lib/legal/common";

type WildberriesBetaNoticeProps = {
  compact?: boolean;
  className?: string;
};

export function WildberriesBetaNotice({ compact = false, className = "" }: WildberriesBetaNoticeProps) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-[16px] border border-amber-500/25 bg-amber-500/10 sm:gap-3 ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3 sm:px-4"
      } ${className}`.trim()}
    >
      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
        Beta
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold leading-snug text-ink ${compact ? "text-xs" : "text-sm"}`}>
          Интеграция с Wildberries в бета-режиме — возможны ошибки.
        </p>
        <p className={`mt-1 break-words leading-relaxed text-muted ${compact ? "text-[11px]" : "text-xs"}`}>
          Если что-то пошло не так, напишите на{" "}
          <a className="font-semibold text-ink underline-offset-2 hover:underline" href={`mailto:${LEGAL_CONTACT}`}>
            {LEGAL_CONTACT}
          </a>
          .
        </p>
      </div>
      {!compact ? <AlertTriangle className="mt-0.5 hidden shrink-0 text-amber-600 sm:block" size={18} /> : null}
    </div>
  );
}
