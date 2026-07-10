import type { KvartovidPropertyType } from "@/types/kvartovid";
import type { VideoAspectRatio, VideoMotionStyle } from "@/types/video-generation";

const MOTION_STYLE_HINTS: Record<VideoMotionStyle, string> = {
  soft_zoom:
    "Camera motion: very slow 2–3% zoom-in across the scene. Calm, inviting real-estate tour feel.",
  premium_parallax:
    "Camera motion: subtle depth parallax with a gentle push-in. Keep any existing text overlays perfectly sharp and fixed.",
  light_sweep:
    "Camera motion: soft light sweep across walls and windows. Keep any existing text overlays perfectly still and readable.",
  marketplace_motion:
    "Camera motion: polished real-estate ad push-in with warm ambient light and premium showcase pacing."
};

const SCENE_FOCUS_PATTERNS: Array<{ pattern: RegExp; focus: string }> = [
  { pattern: /кухн|kitchen/i, focus: "Focus on the modern kitchen and dining area." },
  { pattern: /гостин|living\s*room|зал/i, focus: "Focus on the spacious living room and natural light." },
  { pattern: /спальн|bedroom/i, focus: "Focus on the cozy bedroom and calm atmosphere." },
  { pattern: /окн|window|панорам/i, focus: "Highlight the large windows and daylight." },
  { pattern: /сануз|ванн|bathroom|туалет/i, focus: "Focus on the clean, modern bathroom." },
  { pattern: /балкон|лодж|balcony|terrace/i, focus: "Highlight the balcony or loggia and outdoor view." },
  { pattern: /прихож|hallway|коридор/i, focus: "Show the entryway and sense of space." },
  { pattern: /двор|courtyard|парк|park|зелен/i, focus: "Emphasize green surroundings and outdoor views from the windows." },
  { pattern: /ремонт|renovation|евроремонт|designer/i, focus: "Emphasize fresh modern renovation and premium finishes." },
  { pattern: /студи|studio/i, focus: "Show the open studio layout with a smart combined living space." }
];

function buildAspectFraming(aspectRatio: VideoAspectRatio) {
  switch (aspectRatio) {
    case "16:9":
      return "Horizontal 16:9 cinematic widescreen.";
    case "1:1":
      return "Square 1:1 social video format.";
    case "4:5":
      return "Vertical 4:5 portrait format.";
    default:
      return "Vertical 9:16.";
  }
}

export function inferKvartovidVideoSceneFocus(sources: string[]) {
  const text = sources.filter(Boolean).join(" ");

  for (const entry of SCENE_FOCUS_PATTERNS) {
    if (entry.pattern.test(text)) {
      return entry.focus;
    }
  }

  if (/\d+\s*[-]?\s*комн/i.test(text)) {
    return "Highlight the main living space and natural flow between rooms.";
  }

  return null;
}

function buildPropertyTypeHint(propertyType?: KvartovidPropertyType) {
  switch (propertyType) {
    case "studio":
      return "Property type: studio apartment.";
    case "room":
      return "Property type: rented room in a shared apartment.";
    case "house":
      return "Property type: house with interior rooms.";
    default:
      return "Property type: city apartment.";
  }
}

export function buildKvartovidVeoVideoPrompt(input: {
  title: string;
  description: string;
  advantages?: string[];
  city?: string;
  rooms?: string;
  area?: number;
  propertyType?: KvartovidPropertyType;
  renovation?: string;
  extraFeatures?: string;
  motionStyle: VideoMotionStyle;
  aspectRatio: VideoAspectRatio;
}) {
  const sceneFocus = inferKvartovidVideoSceneFocus([
    input.title,
    input.description,
    ...(input.advantages ?? []),
    input.renovation ?? "",
    input.extraFeatures ?? ""
  ]);

  const highlights = (input.advantages ?? []).slice(0, 3).join("; ");
  const propertyStats = [
    input.rooms ? `${input.rooms}-room` : null,
    input.area ? `${input.area} sqm` : null,
    input.city ? input.city : null
  ]
    .filter(Boolean)
    .join(", ");

  return [
    buildAspectFraming(input.aspectRatio),
    "Transform the uploaded photo into a smooth, cinematic apartment tour.",
    "Clean premium tech style, modern real estate advertising.",
    "Smooth, slow camera movement panning across the room to create a dynamic video feel.",
    "The apartment should look bright, cozy, and highly realistic, like a modern city apartment.",
    buildPropertyTypeHint(input.propertyType),
    propertyStats ? `Listing context: ${propertyStats}.` : null,
    sceneFocus,
    highlights ? `Subtle emphasis for overlays or pacing: ${highlights}.` : null,
    input.description ? `Additional context: ${input.description.slice(0, 280)}.` : null,
    "Include minimalistic, polished UI overlays with dark navy and emerald accent colors, displaying short, neat feature text blocks and generic real estate platform icons when appropriate.",
    MOTION_STYLE_HINTS[input.motionStyle],
    "No people.",
    "No messy, garbled, or unreadable text.",
    "If the source image already contains legible Russian listing text or badges, keep them perfectly sharp and unchanged — do not rewrite or distort.",
    "Do not replace the apartment interior with appliances, gadgets, products, or unrelated objects.",
    "Polished SaaS product demo feeling, practical, and trustworthy mood.",
    `Listing headline: ${input.title}.`
  ]
    .filter(Boolean)
    .join(" ");
}
