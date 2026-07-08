"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import type { MetrikaGoal } from "@/lib/metrika";

type MetrikaGoalLinkProps = {
  href: string;
  goal: MetrikaGoal;
  params?: Record<string, string | number | boolean>;
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function MetrikaGoalLink({
  href,
  goal,
  params,
  children,
  className,
  onClick
}: MetrikaGoalLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      onClick={(event) => {
        trackMarketingEvent(goal, params);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
