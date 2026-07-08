export const YANDEX_METRIKA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "110476730");

export type MetrikaGoal =
  | "click_create_card"
  | "hero_view"
  | "hero_upload_zone_view"
  | "hero_upload_click"
  | "hero_file_selected"
  | "hero_example_selected"
  | "hero_description_started"
  | "hero_description_filled"
  | "hero_demo_generate_click"
  | "hero_demo_generate_success"
  | "hero_demo_generate_error"
  | "header_try_click"
  | "hero_cta_click"
  | "examples_click"
  | "generator_scroll"
  | "photo_upload_started"
  | "photo_uploaded"
  | "description_filled"
  | "demo_generation_started"
  | "demo_generation_completed"
  | "demo_generation_rating"
  | "demo_result_view"
  | "download_demo_click"
  | "download_original_click"
  | "auth_started_from_result"
  | "auth_completed_from_result"
  | "open_cabinet"
  | "upload_photo"
  | "generate_card"
  | "generation_rating"
  | "download_png"
  | "download_json"
  | "copy_description"
  | "save_to_history"
  | "select_marketplace"
  | "select_design_preset"
  | "pricing_click"
  | "payment_click"
  | "anchor_view"
  | "examples_view"
  | "video_example_view"
  | "compare_view"
  | "how_view"
  | "pricing_section_view"
  | "video_pricing_section_view"
  | "pricing_calculator_view"
  | "faq_view"
  | "video_create_click"
  | "video_modal_open"
  | "video_order_created"
  | "video_payment_started"
  | "video_payment_success"
  | "video_generation_started"
  | "video_generation_completed"
  | "video_generation_failed"
  | "video_download";

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
