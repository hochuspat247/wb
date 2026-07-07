"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getAnalyticsSessionId } from "@/lib/analytics/session";
import { recordPresenceAction } from "@/lib/presence/client-state";

function getSessionId() {
  return getAnalyticsSessionId();
}

type TrackPayload = {
  eventType: "page_view" | "click" | "conversion";
  eventName: string;
  label?: string;
  xPercent?: number;
  yPercent?: number;
  metadata?: Record<string, string | number | boolean>;
};

async function sendEvents(events: TrackPayload[]) {
  if (!events.length || typeof window === "undefined") return;

  await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      events: events.map((event) => ({
        ...event,
        path: window.location.pathname + window.location.hash,
        referrer: document.referrer || undefined,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        sessionId: getSessionId()
      }))
    })
  }).catch(() => undefined);
}

export function trackConversion(eventName: string, metadata?: Record<string, string | number | boolean>) {
  void sendEvents([{ eventType: "conversion", eventName, metadata }]);
}

export function trackClick(eventName: string, label?: string) {
  void sendEvents([{ eventType: "click", eventName, label }]);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    void sendEvents([
      {
        eventType: "page_view",
        eventName: "page_view",
        metadata: {
          authed: Boolean(session?.user?.id)
        }
      }
    ]);
  }, [pathname, session?.user?.id]);

  const handleClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const clickable = target.closest("a,button,[data-analytics]");
    if (!clickable) return;

    const label =
      clickable.getAttribute("data-analytics") ||
      clickable.getAttribute("aria-label") ||
      clickable.textContent?.trim().slice(0, 80) ||
      clickable.tagName.toLowerCase();

    const eventName = clickable.tagName === "A" ? "link_click" : "ui_click";
    recordPresenceAction(eventName, label);

    const xPercent = Math.round((event.clientX / window.innerWidth) * 100);
    const yPercent = Math.round((event.clientY / document.documentElement.scrollHeight) * 100);

    void sendEvents([
      {
        eventType: "click",
        eventName: clickable.tagName === "A" ? "link_click" : "ui_click",
        label,
        xPercent,
        yPercent
      }
    ]);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return null;
}
