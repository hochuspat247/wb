"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { trackPageView } from "@/lib/metrika";

function getPageLocation() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.hash;
}

export function HashViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackHashView = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;

      trackPageView(window.location.href);
      trackMarketingEvent("anchor_view", { hash, path: window.location.pathname });
    };

    trackHashView();
    window.addEventListener("hashchange", trackHashView);

    return () => window.removeEventListener("hashchange", trackHashView);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    trackPageView(getPageLocation());
  }, [pathname]);

  return null;
}
