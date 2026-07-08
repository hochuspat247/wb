"use client";

import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { getActionLabel } from "@/lib/presence/labels";
import { recordPresenceAction } from "@/lib/presence/client-state";
import { reachGoal, type MetrikaGoal } from "@/lib/metrika";

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function buildPresenceLabel(goal: MetrikaGoal, metadata?: Record<string, string | number | boolean>) {
  const base = getActionLabel(goal);
  const detail = metadata?.message ?? metadata?.error;

  if (typeof detail === "string" && detail.trim() && goal.includes("error")) {
    return `${base}: ${truncate(detail.trim(), 140)}`;
  }

  return base;
}

export function trackMarketingEvent(goal: MetrikaGoal, metadata?: Record<string, string | number | boolean>) {
  recordPresenceAction(goal, buildPresenceLabel(goal, metadata));
  trackConversion(goal, metadata);
  reachGoal(goal, metadata);
}
