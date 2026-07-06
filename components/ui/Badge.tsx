import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "accent" | "dark" | "outline";
  className?: string;
};

const variants = {
  default: "bg-white/5 text-ink border-clay",
  accent: "bg-accent text-paper border-accent",
  dark: "bg-ink text-paper border-ink",
  outline: "bg-transparent text-muted border-clay"
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
