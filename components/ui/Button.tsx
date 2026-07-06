import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "default" | "sm" | "lg";
  children: ReactNode;
};

const variants = {
  primary:
    "bg-accent text-white border border-accent hover:bg-[#e64b31] hover:-translate-y-px active:translate-y-0",
  secondary:
    "border border-clay bg-card text-ink hover:border-ink/30 hover:bg-sand/50 active:translate-y-0",
  ghost: "bg-transparent text-muted hover:bg-ink/5 hover:text-ink",
  dark: "bg-ink text-white border border-ink hover:bg-ink-soft hover:-translate-y-px"
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
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
