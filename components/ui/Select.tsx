import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[14px] border border-clay bg-card px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-accent/10 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
