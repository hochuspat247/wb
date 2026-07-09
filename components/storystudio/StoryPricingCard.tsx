"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

export type StoryPricingCardProps = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  highlighted?: boolean;
  footer: ReactNode;
};

export function StoryPricingCard({
  name,
  price,
  period,
  features,
  badge,
  highlighted = false,
  footer
}: StoryPricingCardProps) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-card border p-6 ${
        highlighted ? "border-violet bg-violet/10" : "border-white/10 bg-card"
      }`}
    >
      {badge ? (
        <span className="mb-3 inline-block w-fit rounded-full bg-violet/20 px-2.5 py-0.5 text-xs font-semibold text-violet">
          {badge}
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-ink">{name}</h3>

      <div className="mt-2">
        <span className="text-3xl font-bold text-violet">{price}</span>
        {period ? <span className="ml-2 text-sm text-muted">{period}</span> : null}
      </div>

      <ul className="mt-5 flex-1 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">{footer}</div>
    </div>
  );
}
