import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[14px] border border-clay bg-paper/40 px-4 py-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted/55 focus:border-accent/45 focus:ring-2 focus:ring-accent/10 ${className}`}
      {...props}
    />
  );
}
