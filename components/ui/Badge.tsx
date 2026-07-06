import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "accent" | "dark" | "outline";
  className?: string;
};

const variants = {
  default: "bg-paper text-ink border-clay",
  accent: "bg-accent/10 text-accent border-accent/20",
  dark: "bg-ink text-white border-ink",
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
