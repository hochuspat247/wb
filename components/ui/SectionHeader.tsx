import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

type SectionHeaderProps = {
  kicker?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  theme?: "light" | "dark";
};

export function SectionHeader({
  kicker,
  title,
  description,
  align = "center",
  theme = "light"
}: SectionHeaderProps) {
  const isCenter = align === "center";
  const isDark = theme === "dark";

  return (
    <Reveal>
      <div className={`max-w-3xl ${isCenter ? "mx-auto text-center" : ""}`}>
        {kicker ? (
          <span
            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              isDark ? "border-white/15 bg-white/5 text-white/70" : "border-clay bg-card text-muted"
            }`}
          >
            {kicker}
          </span>
        ) : null}
        <h2
          className={`mt-5 text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem] ${
            isDark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-4 text-base leading-relaxed md:text-lg ${
              isDark ? "text-white/60" : "text-muted"
            } ${isCenter ? "mx-auto max-w-2xl" : "max-w-xl"}`}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
