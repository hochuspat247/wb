"use client";

export const GUEST_ID_KEY = "marketcard_guest_id";
export const INTENDED_ACTION_KEY = "marketcard_demo_intended_action";
export const INTENDED_GENERATION_KEY = "marketcard_demo_generation_id";
export const AUTH_FROM_RESULT_KEY = "marketcard_auth_from_result_generation_id";
export const CABINET_DEMO_HINT_DISMISSED_KEY = "marketcard_cabinet_demo_hint_dismissed";

export function buildCabinetFromDemoUrl(generationId: string) {
  return `/cabinet?fromDemo=${encodeURIComponent(generationId)}`;
}

export function getOrCreateGuestId() {
  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(GUEST_ID_KEY, next);
  return next;
}
