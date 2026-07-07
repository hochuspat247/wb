"use client";

import { useEffect } from "react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";

export function HeroViewTracker() {
  useEffect(() => {
    trackMarketingEvent("hero_view");
  }, []);

  return null;
}
