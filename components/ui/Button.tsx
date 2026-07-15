import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "default" | "sm" | "lg";
  children: ReactNode;
};

const variants = {
  primary:
    "wow-btn bg-accent text-on-accent border border-accent shadow-[0_10px_28px_rgba(191,249,63,0.35)] hover:bg-[#D4FF6B] hover:shadow-[0_14px_34px_rgba(191,249,63,0.45)]",
  secondary:
    "wow-btn border border-clay bg-card text-ink hover:border-ink/20 hover:bg-sand",
  ghost: "wow-btn bg-transparent text-muted hover:bg-ink/[0.04] hover:text-ink",
  dark: "wow-btn bg-ink text-white border border-ink hover:bg-ink-soft shadow-[0_10px_28px_rgba(28,28,28,0.18)]"
};

const sizes = {
  default: "min-h-11 px-5 py-2.5 text-sm rounded-button",
  sm: "min-h-9 px-4 py-2 text-sm rounded-button",
  lg: "min-h-12 px-7 py-3 text-base rounded-button"
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
