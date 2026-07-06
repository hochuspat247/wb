import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-ink/15 bg-[#fffaf0] px-4 py-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-mint/30 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
