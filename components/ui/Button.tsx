import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  children: ReactNode;
};

const variants = {
  primary: "bg-coral text-white shadow-card hover:bg-[#e85a3a] hover:shadow-glow active:scale-[0.98]",
  secondary: "border border-ink/10 bg-white/90 text-ink backdrop-blur-sm hover:border-ink/20 hover:bg-paper hover:shadow-soft active:scale-[0.98]",
  ghost: "bg-transparent text-muted hover:bg-ink/5 hover:text-ink active:scale-[0.98]",
  dark: "bg-ink text-white hover:bg-ink-soft hover:shadow-glow-violet active:scale-[0.98]"
};

export function Button({ className = "", variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
