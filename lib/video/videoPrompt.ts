import { detectProductSceneCategory, type ProductSceneCategory } from "@/lib/ai/cardPromptBuilder";
import type { ProductCardResult } from "@/types/product-card";
import type { VideoMotionStyle, VideoAspectRatio } from "@/types/video-generation";

export type VideoPromptCategory = ProductSceneCategory | "perfumery";

type VideoCardContext = Pick<
  ProductCardResult,
  "title" | "headline" | "shortDescription" | "fullDescription" | "category" | "visualConcept"
>;

const PERFUMERY_KEYWORDS = [
  "perfume",
  "parfum",
  "fragrance",
  "eau de",
  "cologne",
  "духи",
  "парфюм",
  "туалетная вода",
  "одеколон"
];

const MOTION_STYLE_OVERRIDES: Record<VideoMotionStyle, string> = {
  soft_zoom:
    "Use only a very slow 2-3% zoom-in over the full frame. No parallax, no text movement, no background replacement. The card must look like a static design with barely noticeable camera push.",
  premium_parallax:
    "Allow only subtle depth parallax in the background and product area. Text blocks, headlines, bullet lists and badges must remain perfectly flat, sharp and locked in place — zero movement on typography.",
  light_sweep:
    "Add a soft light sweep across the product surface and background only. Typography, icons and text panels must not move, warp or change.",
  marketplace_motion:
    "Create a polished marketplace ad feel with gentle camera push and soft product highlight. Keep the entire text layout frozen — animate only camera and ambient light."
};

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function combinedCardText(card: VideoCardContext) {
  return [card.title, card.headline, card.shortDescription, card.fullDescription, card.category, card.visualConcept]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function detectVideoPromptCategory(card: VideoCardContext): VideoPromptCategory {
  const text = combinedCardText(card);

  if (PERFUMERY_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "perfumery";
  }

  return detectProductSceneCategory({
    productDescription: [card.shortDescription, card.fullDescription].map(clean).filter(Boolean).join(" "),
    category: card.category,
    title: card.title || card.headline
  });
}

function buildPreservationRules() {
  return [
    "Image-to-video task: animate the provided marketplace product card image.",
    "",
    "CRITICAL — preserve the source image exactly:",
    "- All Russian text, headlines, bullet points, numbers, badges and icons must stay pixel-sharp and unchanged.",
    "- Do NOT rewrite, translate, blur, distort, morph or regenerate any letters or words.",
    "- Do NOT invent new Cyrillic text, gibberish, misspellings or random characters.",
    "- Keep product shape, packaging, colors, card layout and composition identical to the input.",
    "- Do NOT replace the scene, add splashes, smoke, new props, logos or watermarks.",
    "- Do NOT crop, rotate or reframe the card.",
    "",
    "ALLOWED motion only:",
    "- Very subtle slow camera zoom or push (2-5% max).",
    "- Soft light shift or reflection on product and background.",
    "- Minimal background-only parallax — text panels must stay fixed.",
    "",
    "The result must look like a motion designer gently animated a finished static card, not like AI re-rendered the design."
  ].join("\n");
}

function buildMinimalSceneHint(card: VideoCardContext, category: VideoPromptCategory) {
  const title = clean(card.title || card.headline);
  const categoryLabel = getVideoPromptCategoryLabel(category);

  return [
    "Context (do not add new visuals, use only for understanding the product):",
    title ? `- Product: ${title}` : `- Category: ${categoryLabel}`,
    "- Animate the existing card as-is. Do not generate a new scene or close-up."
  ].join("\n");
}

function buildAspectRatioHint(aspectRatio?: VideoAspectRatio) {
  if (!aspectRatio) {
    return "";
  }

  if (aspectRatio === "4:5" || aspectRatio === "1:1") {
    return [
      "Output framing:",
      "- Keep a vertical marketplace card composition.",
      "- The source card is vertical; do not crop it into a horizontal 16:9 frame.",
      "- Preserve the full card inside a vertical 9:16 video frame."
    ].join("\n");
  }

  if (aspectRatio === "9:16") {
    return "Output framing: vertical 9:16 video, preserve the full card composition.";
  }

  return "Output framing: horizontal 16:9 video.";
}

export function buildProductCardVideoPrompt(input: {
  motionStyle: VideoMotionStyle;
  aspectRatio?: VideoAspectRatio;
  card?: VideoCardContext | null;
  customPrompt?: string;
}) {
  const category = input.card ? detectVideoPromptCategory(input.card) : "other";
  const aspectHint = buildAspectRatioHint(input.aspectRatio);

  return [
    buildPreservationRules(),
    "",
    input.card ? buildMinimalSceneHint(input.card, category) : "",
    aspectHint ? `\n${aspectHint}` : "",
    "",
    `Motion style:\n${MOTION_STYLE_OVERRIDES[input.motionStyle]}`,
    "",
    "Final reminder: typography and Russian text must remain 100% readable and identical to the source image.",
    input.customPrompt ? `\nAdditional direction:\n${input.customPrompt}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function getVideoPromptCategoryLabel(category: VideoPromptCategory) {
  const labels: Record<VideoPromptCategory, string> = {
    perfumery: "Парфюмерия",
    beauty: "Косметика и уход",
    electronics: "Электроника",
    home: "Дом и интерьер",
    apparel: "Одежда и аксессуары",
    sport: "Спорт",
    kids: "Детские товары",
    pet_product: "Товары для животных",
    water_transport: "Водный транспорт",
    automotive: "Авто",
    tools: "Инструменты",
    other: "Универсальный"
  };

  return labels[category];
}
