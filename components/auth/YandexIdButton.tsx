"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type YandexIdButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

export function YandexIdButton({ children = "Войти с Яндекс ID", className = "", ...props }: YandexIdButtonProps) {
  return (
    <button
      className={`group flex min-h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-[#d8d8d8] bg-white px-4 text-[15px] font-semibold text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:bg-[#f6f6f6] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      type="button"
      {...props}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FC3F1D] text-[18px] font-black leading-none text-white">
        Я
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}
