"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4;
  immediate?: boolean;
  variant?: "up" | "left" | "right" | "scale";
};

export function Reveal({
  children,
  className = "",
  delay,
  immediate = false,
  variant = "up"
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (immediate) {
      const timer = window.setTimeout(() => {
        node.classList.add("visible");
      }, 40);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  const delayClass = delay ? `reveal-delay-${delay}` : "";
  const variantClass =
    variant === "left"
      ? "reveal-fade-left"
      : variant === "right"
        ? "reveal-fade-right"
        : variant === "scale"
          ? "reveal-scale"
          : "";

  return (
    <div className={`reveal ${variantClass} ${delayClass} ${className}`.trim()} ref={ref}>
      {children}
    </div>
  );
}
