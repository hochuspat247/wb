import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddings = {
  none: "",
  sm: "p-5",
  md: "p-6",
  lg: "p-8"
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`rounded-card border border-clay bg-card ${paddings[padding]} ${
        hover ? "transition duration-200 hover:-translate-y-0.5 hover:border-ink/10" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
