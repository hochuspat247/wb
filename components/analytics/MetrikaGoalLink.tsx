"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { reachGoal, type MetrikaGoal } from "@/lib/metrika";

type MetrikaGoalLinkProps = {
  href: string;
  goal: MetrikaGoal;
  params?: Record<string, unknown>;
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
        reachGoal(goal, params);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
