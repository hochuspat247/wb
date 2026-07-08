"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4;
  immediate?: boolean;
};

export function Reveal({ children, className = "", delay, immediate = false }: RevealProps) {
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <div className={`reveal ${delayClass} ${className}`} ref={ref}>
      {children}
    </div>
  );
}
