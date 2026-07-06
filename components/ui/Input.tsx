import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-clay bg-card px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink/30 focus:ring-2 focus:ring-lavender/60 ${className}`}
      {...props}
    />
  );
}
