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

/**
 * Fire-and-forget marketing funnel event.
 * Must never throw — Metrika / network failures must not block registration or payment.
 */
export function trackMarketingEvent(goal: MetrikaGoal, metadata?: Record<string, string | number | boolean>) {
  try {
    recordPresenceAction(goal, buildPresenceLabel(goal, metadata));
  } catch {
    // ignore
  }

  try {
    trackConversion(goal, metadata);
  } catch {
    // ignore
  }

  try {
    reachGoal(goal, metadata);
  } catch {
    // ignore
  }
}
