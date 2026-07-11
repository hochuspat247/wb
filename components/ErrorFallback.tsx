"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/branding";

type ErrorFallbackProps = {
  title?: string;
  description?: string;
  reset?: () => void;
  resetLabel?: string;
  homeHref?: string;
};

export function ErrorFallback({
  title = "Что-то пошло не так",
  description = "Страница столкнулась с ошибкой. Попробуйте обновить — ваши данные и генерации сохранены.",
  reset,
  resetLabel = "Попробовать снова",
  homeHref = "/"
}: ErrorFallbackProps) {
  return (
    <div className="section-shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{BRAND.marketCard}</p>
        <h1 className="mt-4 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-white/60">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {reset ? (
            <Button onClick={reset} type="button">
              <RefreshCcw size={16} />
              {resetLabel}
            </Button>
          ) : null}
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            href={homeHref}
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
