"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getAnalyticsSessionId } from "@/lib/analytics/session";
import { storeLastVisitedProduct } from "@/lib/auth/signup-context-client";
import { getOrCreateGuestId, getOrCreateStoryGuestId } from "@/lib/guest";
import { reachGoal } from "@/lib/metrika";
import { recordPresenceAction } from "@/lib/presence/client-state";

function getSessionId() {
  try {
    return getAnalyticsSessionId();
  } catch {
    return "anonymous";
  }
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

  try {
    let guestId = "anonymous";
    try {
      guestId = getOrCreateGuestId();
    } catch {
      // localStorage may be unavailable
    }

    let storyGuestId: string | undefined;
    try {
      storyGuestId = window.location.pathname.startsWith("/storystudio")
        ? getOrCreateStoryGuestId()
        : undefined;
    } catch {
      storyGuestId = undefined;
    }

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        events: events.map((event) => ({
          ...event,
          metadata: {
            ...(event.metadata || {}),
            guestId,
            ...(storyGuestId ? { storyGuestId } : {})
          },
          path: window.location.pathname + window.location.hash,
          referrer: document.referrer || undefined,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          sessionId: getSessionId()
        }))
      })
    });
  } catch {
    // Analytics must never break registration, auth, or browsing.
  }
}

export function trackConversion(eventName: string, metadata?: Record<string, string | number | boolean>) {
  try {
    void sendEvents([{ eventType: "conversion", eventName, metadata }]);
  } catch {
    // ignore
  }
}

export function trackClick(eventName: string, label?: string) {
  try {
    void sendEvents([{ eventType: "click", eventName, label }]);
  } catch {
    // ignore
  }
}

export function trackAuthError(
  eventName: "register_error" | "login_error" | "oauth_error",
  metadata?: Record<string, string | number | boolean>
) {
  try {
    void sendEvents([{ eventType: "conversion", eventName, metadata }]);
  } catch {
    // ignore
  }

  try {
    reachGoal(eventName, metadata);
  } catch {
    // ignore
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    try {
      storeLastVisitedProduct(pathname);
      void sendEvents([
        {
          eventType: "page_view",
          eventName: "page_view",
          metadata: {
            authed: Boolean(session?.user?.id),
            hash: typeof window !== "undefined" ? window.location.hash : ""
          }
        }
      ]);
    } catch {
      // ignore
    }
  }, [pathname, session?.user?.id]);

  useEffect(() => {
    const onHashChange = () => {
      void sendEvents([
        {
          eventType: "page_view",
          eventName: "anchor_view",
          metadata: {
            hash: window.location.hash,
            path: window.location.pathname
          }
        }
      ]);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    try {
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
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return null;
}
