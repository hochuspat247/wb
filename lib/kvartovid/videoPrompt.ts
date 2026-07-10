import type { VideoAspectRatio, VideoMotionStyle } from "@/types/video-generation";
import { BRAND } from "@/lib/branding";

const MOTION_STYLE_HINTS: Record<VideoMotionStyle, string> = {
  soft_zoom: "Very slow 2-3% zoom-in across the apartment scene. Calm, inviting real-estate tour feel.",
  premium_parallax:
    "Subtle depth parallax in the room and background. Text overlays on the listing cover must stay sharp and fixed.",
  light_sweep: "Soft light sweep across walls and windows. Keep any Russian text overlays perfectly still and readable.",
  marketplace_motion:
    "Polished real-estate ad motion: gentle camera push, warm ambient light, premium apartment showcase."
};

function buildAspectHint(aspectRatio: VideoAspectRatio) {
  if (aspectRatio === "16:9") {
    return "Output framing: horizontal 16:9 video for ads.";
  }

  if (aspectRatio === "1:1" || aspectRatio === "4:5") {
    return "Output framing: vertical 9:16 marketplace video — preserve the listing cover composition.";
  }

  return "Output framing: vertical 9:16 for Stories, Reels and Shorts.";
}

export function buildKvartovidVeoVideoPrompt(input: {
  title: string;
  description: string;
  advantages?: string[];
  city?: string;
  motionStyle: VideoMotionStyle;
  aspectRatio: VideoAspectRatio;
}) {
  const highlights = (input.advantages ?? []).slice(0, 4).join(", ");

  return [
    `Image-to-video for a Russian real estate listing cover (${BRAND.kvartovid}).`,
    "Animate the provided apartment listing image as a short property tour.",
    "",
    "CRITICAL:",
    "- Preserve all Russian text, badges and overlay typography exactly — no rewriting or distortion.",
    "- Keep the room, layout, colors and listing design identical to the source image.",
    "- Do NOT invent new rooms, furniture, watermarks or random text.",
    "- Allowed motion: slow camera push, soft parallax, gentle light changes only.",
    "",
    `Property: ${input.title}`,
    input.city ? `City: ${input.city}` : "",
    highlights ? `Highlights: ${highlights}` : "",
    input.description ? `Context: ${input.description.slice(0, 350)}` : "",
    "",
    buildAspectHint(input.aspectRatio),
    `Motion style: ${MOTION_STYLE_HINTS[input.motionStyle]}`,
    "End feeling: bright apartment showcase with CTA mood — book a viewing."
  ]
    .filter(Boolean)
    .join("\n");
}
