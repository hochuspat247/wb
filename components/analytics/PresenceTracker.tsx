"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getAnalyticsSessionId } from "@/lib/analytics/session";
import { GUEST_ID_KEY } from "@/lib/guest";
import { getActionLabel, TRACKED_SECTION_IDS } from "@/lib/presence/labels";
import { getPresenceAction, getPresenceSection, recordPresenceAction, setPresenceSection } from "@/lib/presence/client-state";

const HEARTBEAT_MS = 25_000;

async function sendPresence() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  const action = getPresenceAction();
  const guestId = window.localStorage.getItem(GUEST_ID_KEY) || undefined;

  await fetch("/api/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      sessionId: getAnalyticsSessionId(),
      path: window.location.pathname + window.location.hash,
      section: getPresenceSection() || undefined,
      lastAction: action.action || undefined,
      lastActionLabel: action.label || getActionLabel(action.action) || undefined,
      guestId,
      isVisible: document.visibilityState === "visible",
      referrer: document.referrer || undefined
    })
  }).catch(() => undefined);
}

export function PresenceTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const ratiosRef = useRef<Record<string, number>>({});

  const updateVisibleSection = useCallback(() => {
    const entries = Object.entries(ratiosRef.current).filter(([, ratio]) => ratio > 0);
    if (!entries.length) {
      if (pathname.startsWith("/cabinet")) {
        setPresenceSection("cabinet");
        return;
      }
      if (pathname.startsWith("/generations/")) {
        setPresenceSection("demo-result");
        return;
      }
      if (pathname === "/login") {
        setPresenceSection("login");
        return;
      }
      if (pathname === "/register") {
        setPresenceSection("register");
        return;
      }
      setPresenceSection(pathname === "/" ? "hero" : "");
      return;
    }

    const [bestSection] = entries.sort((a, b) => b[1] - a[1])[0];
    setPresenceSection(bestSection);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    recordPresenceAction("page_view", "Открыл страницу");
    void sendPresence();
  }, [pathname, session?.user?.id]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const timer = window.setInterval(() => {
      void sendPresence();
    }, HEARTBEAT_MS);

    const handleVisibility = () => {
      void sendPresence();
    };

    const handlePageHide = () => {
      void sendPresence();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pathname, session?.user?.id]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    ratiosRef.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          ratiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        updateVisibleSection();
      },
      {
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1]
      }
    );

    const observeTargets = () => {
      observer.disconnect();
      ratiosRef.current = {};

      for (const id of TRACKED_SECTION_IDS) {
        const node = document.getElementById(id);
        if (node) observer.observe(node);
      }

      updateVisibleSection();
    };

    observeTargets();

    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const handleScroll = () => updateVisibleSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname, updateVisibleSection]);

  return null;
}
