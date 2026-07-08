"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import type { MetrikaGoal } from "@/lib/metrika";
import { TRACKED_SECTION_IDS } from "@/lib/presence/labels";

const SECTION_GOALS: Partial<Record<string, MetrikaGoal>> = {
  examples: "examples_view",
  "video-example": "video_example_view",
  compare: "compare_view",
  how: "how_view",
  pricing: "pricing_section_view",
  "video-pricing": "video_pricing_section_view",
  "pricing-calculator": "pricing_calculator_view",
  faq: "faq_view"
};

const SEEN_SECTIONS_KEY = "mc_seen_sections";

function getSeenSections(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.sessionStorage.getItem(SEEN_SECTIONS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markSectionSeen(sectionId: string) {
  const seen = getSeenSections();
  seen.add(sectionId);
  window.sessionStorage.setItem(SEEN_SECTIONS_KEY, JSON.stringify([...seen]));
}

function trackSectionOnce(sectionId: string) {
  const goal = SECTION_GOALS[sectionId];
  if (!goal) return;

  const seen = getSeenSections();
  if (seen.has(sectionId)) return;

  markSectionSeen(sectionId);
  trackMarketingEvent(goal, { section: sectionId });
}

export function SectionViewTracker() {
  const pathname = usePathname();
  const ratiosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    ratiosRef.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          ratiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            trackSectionOnce(id);
          }
        }
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
    };

    observeTargets();

    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
