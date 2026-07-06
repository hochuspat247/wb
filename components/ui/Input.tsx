import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-ink/15 bg-[#fffaf0] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-4 focus:ring-mint/30 ${className}`}
      {...props}
    />
  );
}
