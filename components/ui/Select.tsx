import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-clay bg-card px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-lavender/60 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
