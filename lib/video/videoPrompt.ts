import { detectProductSceneCategory, type ProductSceneCategory } from "@/lib/ai/cardPromptBuilder";
import type { ProductCardResult } from "@/types/product-card";
import type { VideoMotionStyle } from "@/types/video-generation";

export type VideoPromptCategory = ProductSceneCategory | "perfumery";

type VideoCategoryProfile = {
  subject: string;
  backgroundDynamics: string;
  lighting: string;
  cameraMotion: string;
};

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
  "аромат",
  "туалетная вода",
  "одеколон"
];

const PREMIUM_TRIGGERS =
  "Product commercial, High-end advertising, Luxury aesthetic, Smooth cinematic camera pan, Slow-motion, Macro lens, Studio lighting, Volumetric light, Soft shadows, Photorealistic, Clean background, Commercial quality, Raytracing look.";

const CATEGORY_PROFILES: Record<VideoPromptCategory, VideoCategoryProfile> = {
  perfumery: {
    subject: "a premium glass perfume bottle with liquid reflecting the light",
    backgroundDynamics: "slow-motion splash of water and silk fabric waving gently in the wind, dramatic backlighting, subtle light smoke",
    lighting: "dramatic backlighting, studio lighting, volumetric light, soft shadows, luxury aesthetic",
    cameraMotion: "smooth orbiting camera shot around the bottle, slow cinematic pan, subtle zoom-in"
  },
  beauty: {
    subject: "a luxury cosmetic cream jar with white smooth cream texture inside",
    backgroundDynamics:
      "soft focus background with a white lily flower, subtle water droplets splashing, elegant gold particles floating around",
    lighting: "cinematic soft lighting, glowing skin effect, studio lighting, volumetric light, soft shadows",
    cameraMotion: "smooth slow-motion camera pan and subtle zoom-in, macro lens feel"
  },
  electronics: {
    subject: "sleek modern consumer electronics product with sharp premium materials",
    backgroundDynamics: "dark techno aesthetic, neon blue and purple accent lights, subtle smoke effect, clean reflections",
    lighting: "sharp studio lighting, controlled highlights, volumetric accent lights, commercial product lighting",
    cameraMotion: "dynamic camera rotation with controlled speed, subtle technical blueprint elements fading in"
  },
  home: {
    subject: "a premium home or kitchen product with refined materials and clean design",
    backgroundDynamics: "soft lifestyle background blur, gentle ambient particles, subtle natural light movement",
    lighting: "warm studio lighting, soft volumetric shadows, elegant clean atmosphere",
    cameraMotion: "smooth slow-motion camera pan and subtle zoom-in"
  },
  apparel: {
    subject: "a premium fashion or apparel product with elegant fabric texture",
    backgroundDynamics: "soft fabric motion in the background, gentle wind effect, subtle light particles",
    lighting: "fashion editorial lighting, soft shadows, clean premium atmosphere",
    cameraMotion: "smooth cinematic camera pan with subtle parallax depth"
  },
  sport: {
    subject: "a modern sports or fitness product with energetic premium styling",
    backgroundDynamics: "subtle motion blur energy, soft dynamic particles, clean active lifestyle atmosphere",
    lighting: "bright studio lighting, crisp highlights, commercial sports advertising look",
    cameraMotion: "smooth dynamic camera push-in with controlled slow-motion emphasis"
  },
  kids: {
    subject: "a playful premium children's product with bright friendly presentation",
    backgroundDynamics: "soft colorful bokeh motion, gentle floating particles, cheerful clean atmosphere",
    lighting: "bright soft studio lighting, clean shadows, family-friendly commercial look",
    cameraMotion: "gentle smooth camera pan and subtle zoom-in"
  },
  pet_product: {
    subject: "a premium pet care product with clean trustworthy presentation",
    backgroundDynamics: "soft natural background motion, gentle light particles, calm lifestyle atmosphere",
    lighting: "warm studio lighting, soft shadows, clean commercial quality",
    cameraMotion: "smooth slow-motion camera pan and subtle zoom-in"
  },
  water_transport: {
    subject: "a premium marine or water transport product with polished surfaces",
    backgroundDynamics: "subtle water ripples, soft horizon light movement, elegant outdoor atmosphere",
    lighting: "natural cinematic lighting, soft volumetric shadows, premium outdoor commercial look",
    cameraMotion: "smooth cinematic camera pan with subtle parallax depth"
  },
  automotive: {
    subject: "a premium automotive accessory with sharp industrial design",
    backgroundDynamics: "subtle garage atmosphere motion, soft smoke and light streaks, technical premium mood",
    lighting: "dramatic studio lighting, controlled reflections, commercial automotive advertising look",
    cameraMotion: "smooth dynamic camera rotation with subtle zoom-in"
  },
  tools: {
    subject: "a professional tool or hardware product with rugged premium finish",
    backgroundDynamics: "subtle workshop atmosphere motion, soft dust particles, clean industrial background",
    lighting: "crisp studio lighting, strong product highlights, commercial-grade look",
    cameraMotion: "smooth controlled camera pan with macro detail emphasis"
  },
  other: {
    subject: "the product shown on this marketplace card",
    backgroundDynamics: "gentle motion of soft light particles, subtle background parallax, elegant clean atmosphere",
    lighting: "professional studio lighting, soft volumetric shadows, elegant and clean atmosphere",
    cameraMotion: "smooth slow-motion camera pan and subtle zoom-in"
  }
};

const MOTION_STYLE_OVERRIDES: Record<VideoMotionStyle, string> = {
  soft_zoom:
    "Use only a very soft slow-motion camera zoom-in. Keep background motion minimal and premium. No chaotic movement.",
  premium_parallax:
    "Add premium parallax depth between product, text layers and background while keeping all card elements perfectly readable.",
  light_sweep:
    "Add a soft cinematic light sweep across the product and background. Light reflection passing across surfaces without changing text.",
  marketplace_motion:
    "Create a clean marketplace-style animated ad with subtle polished movement and a final premium commercial look."
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

function buildSubject(card: VideoCardContext, profile: VideoCategoryProfile) {
  const title = clean(card.title || card.headline);

  if (title) {
    return `the product shown on this marketplace card (${title})`;
  }

  return profile.subject;
}

function buildCommercialSceneFromProfile(profile: VideoCategoryProfile, subject = profile.subject) {
  return [
    "Commercial product advertisement, high-end marketplace video.",
    `Close-up macro shot of ${subject}.`,
    `${profile.lighting}.`,
    `${profile.cameraMotion}.`,
    `In the background, there is a gentle motion of ${profile.backgroundDynamics}.`,
    "4K resolution, cinematic composition, photorealistic, commercial-grade CGI look."
  ].join(" ");
}

function buildCommercialScene(card: VideoCardContext, category: VideoPromptCategory) {
  const profile = CATEGORY_PROFILES[category];
  const subject = buildSubject(card, profile);

  return buildCommercialSceneFromProfile(profile, subject);
}

function buildPreservationRules() {
  return [
    "Critical rules for image-to-video:",
    "- Animate this image. Bring this marketplace product card shot to life.",
    "- Keep the original product card layout unchanged.",
    "- Keep all text, numbers, letters, icons, badges and typography unchanged.",
    "- Do not rewrite, distort, replace, translate or deform any text.",
    "- Do not change product shape, packaging design, colors or marketplace card composition.",
    "- Do not add new random objects, logos or watermarks.",
    "- Do not crop important parts of the card.",
    "- Do not make chaotic camera movement.",
    "- Animate only motion: camera movement, light sweep, soft background parallax and subtle product emphasis.",
    "The result should look like a premium animated product ad made by a motion designer, not a distorted AI video."
  ].join("\n");
}

export function buildProductCardVideoPrompt(input: {
  motionStyle: VideoMotionStyle;
  card?: VideoCardContext | null;
  customPrompt?: string;
}) {
  const category = input.card ? detectVideoPromptCategory(input.card) : "other";
  const commercialScene = input.card
    ? buildCommercialScene(input.card, category)
    : buildCommercialSceneFromProfile(CATEGORY_PROFILES.other);

  return [
    buildPreservationRules(),
    "",
    "Commercial scene direction:",
    commercialScene,
    "",
    `Motion style:\n${MOTION_STYLE_OVERRIDES[input.motionStyle]}`,
    "",
    `Premium marketplace triggers:\n${PREMIUM_TRIGGERS}`,
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
