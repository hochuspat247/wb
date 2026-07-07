export const ANALYTICS_SESSION_KEY = "mc_analytics_session";

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(ANALYTICS_SESSION_KEY, next);
  return next;
}
