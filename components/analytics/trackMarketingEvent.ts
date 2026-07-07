"use client";

import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { getActionLabel } from "@/lib/presence/labels";
import { recordPresenceAction } from "@/lib/presence/client-state";
import { reachGoal, type MetrikaGoal } from "@/lib/metrika";

export function trackMarketingEvent(goal: MetrikaGoal, metadata?: Record<string, string | number | boolean>) {
  recordPresenceAction(goal, getActionLabel(goal));
  trackConversion(goal, metadata);
  reachGoal(goal, metadata);
}
