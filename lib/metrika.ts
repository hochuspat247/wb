export const YANDEX_METRIKA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "110476730");

export type MetrikaGoal =
  | "click_create_card"
  | "open_cabinet"
  | "upload_photo"
  | "generate_card"
  | "download_png"
  | "download_json"
  | "copy_description"
  | "save_to_history"
  | "select_marketplace"
  | "select_design_preset"
  | "pricing_click";

export function reachGoal(goal: MetrikaGoal, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!YANDEX_METRIKA_ID) return;
  if (typeof window.ym !== "function") return;

  window.ym(YANDEX_METRIKA_ID, "reachGoal", goal, params || {});
}

export function trackPageView(url: string) {
  if (typeof window === "undefined") return;
  if (!YANDEX_METRIKA_ID) return;
  if (typeof window.ym !== "function") return;

  window.ym(YANDEX_METRIKA_ID, "hit", url);
}
