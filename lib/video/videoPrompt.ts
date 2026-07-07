import type { VideoMotionStyle } from "@/types/video-generation";

export function buildProductCardVideoPrompt(input: {
  motionStyle: VideoMotionStyle;
  customPrompt?: string;
}) {
  const basePrompt = `
Animate this marketplace product card with subtle professional motion.

Critical rules:
- Keep the original product card layout unchanged.
- Keep all text, numbers, letters, icons, badges and typography unchanged.
- Do not rewrite, distort, replace, translate or deform any text.
- Do not change product shape, colors, composition or marketplace card design.
- Do not add new random objects.
- Do not add new logos.
- Do not crop important parts of the card.
- Do not make chaotic camera movement.

Motion direction:
- slow premium camera push-in
- subtle parallax depth
- gentle light sweep
- slight product emphasis
- soft motion on background only
- polished e-commerce advertising style
- clean professional motion design
- realistic, smooth, minimal movement

The result should look like a premium animated product ad made by a motion designer, not like a distorted AI video.
`.trim();

  const styleMap: Record<VideoMotionStyle, string> = {
    soft_zoom: "Use only a very soft camera zoom-in and minimal background movement.",
    premium_parallax:
      "Add premium parallax depth between product, text and background while keeping all elements readable.",
    light_sweep: "Add a soft light sweep across the product and background, without changing text.",
    marketplace_motion:
      "Create a clean marketplace-style animated ad with subtle movement and final polished look."
  };

  return `${basePrompt}\n\nMotion style:\n${styleMap[input.motionStyle]}\n${input.customPrompt || ""}`.trim();
}
