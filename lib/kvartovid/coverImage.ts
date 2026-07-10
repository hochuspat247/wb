import { generateNanoBananaExpertReferenceEdit } from "@/lib/ai/nanobananaExpert";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import type { KvartovidListingInput } from "@/types/kvartovid";
import type { GenerateImageResult } from "@/types/product-card";

const BAD_COVER_TITLE_PATTERN =
  /\b(машин|пылесос|товар|корзин|артикул|sku|гаджет|бытов\w*\s+техник)\b/i;

function shortenOverlayLine(text: string, max = 28): string {
  const first = text.split(/[.,;:!?]/)[0]?.trim() || text.trim();
  if (first.length <= max) return first;

  const words = first.split(/\s+/);
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max) break;
    line = next;
  }

  return line || `${first.slice(0, max - 1)}…`;
}

export function buildKvartovidCoverHeadline(
  input: KvartovidListingInput,
  aiTitle: string,
  platformAvitoTitle?: string
): string {
  const candidates = [platformAvitoTitle, aiTitle].map((value) => value?.trim()).filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate.length >= 8 && candidate.length <= 75 && !BAD_COVER_TITLE_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  const property = PROPERTY_TYPE_LABELS[input.propertyType].toLowerCase();
  const dealSuffix = input.dealType === "rent" ? " в аренду" : input.dealType === "daily" ? " посуточно" : "";
  const location = input.metro || input.district || input.city;

  return `${input.rooms}-комн. ${property}${dealSuffix}, ${input.area} м², ${location}`.slice(0, 75);
}

export function buildKvartovidCoverImagePrompt(
  input: KvartovidListingInput,
  headline: string,
  advantages: string[]
): string {
  const deal = DEAL_TYPE_LABELS[input.dealType];
  const property = PROPERTY_TYPE_LABELS[input.propertyType];
  const overlayLines = advantages.slice(0, 3).map((line) => shortenOverlayLine(line));
  const location = [input.city, input.district, input.metro].filter(Boolean).join(", ");

  return `
REAL ESTATE LISTING COVER — INTERIOR PHOTO EDIT (NOT E-COMMERCE)

You receive a photograph of a REAL APARTMENT INTERIOR: living room, bedroom, kitchen, hallway, or studio.

THIS IS REAL ESTATE ADVERTISING FOR RUSSIAN MARKETPLACES (Avito / Cian).
THIS IS NOT A PRODUCT CARD. NOT A MARKETPLACE PRODUCT LISTING. NOT A CATALOG SHOT OF APPLIANCES.

REFERENCE IMAGE RULES (CRITICAL):
- The uploaded photo shows an APARTMENT ROOM: walls, floor, windows, ceiling, doors, furniture.
- KEEP the same room, same architecture, same furniture layout, same camera perspective.
- ONLY enhance: exposure, white balance, clarity, slight warmth, gentle crop for cover composition.
- Do NOT replace the room with appliances, vacuum cleaners, gadgets, machines, products, or random objects.
- Do NOT invent a new scene unrelated to the uploaded interior.
- Do NOT create a product showcase, e-commerce card, flyer, brochure, or catalog layout with a hero product.
- The main subject must remain the APARTMENT INTERIOR, not any household device.

OPTIONAL OVERLAY (subtle, premium real estate style):
- Add a soft semi-transparent dark gradient bar at the top or bottom (max 25% of image height).
- Russian headline: "${headline}"
- Short Russian benefit badges (2-3 lines max):
${overlayLines.map((line) => `  - ${line}`).join("\n")}
- Typography: clean modern sans-serif, white or light text, readable, short lines.
- No prices, no phone buttons, no marketplace logos, no cart icons, no fake UI.

PROPERTY CONTEXT:
- Deal: ${deal}
- Type: ${property}
- Rooms: ${input.rooms}
- Area: ${input.area} m²
- Location: ${location}

STRICT FORBIDDEN CONTENT:
- No vacuum cleaners, washing machines, or appliances as the hero subject
- No standalone product photography
- No word "МАШИНА", no random product names, no "добавить в корзину"
- No watermarks, QR codes, fake ratings, official marketplace logos
- No replacing the apartment with a studio product shot

OUTPUT:
Photorealistic apartment interior photo, aspect ratio 4:3, suitable as the main cover image on a Russian real estate listing.
Only the final image. No mockup frame. No explanation.
`.trim();
}

export async function generateKvartovidCoverImage(
  input: KvartovidListingInput,
  photo: { base64: string; mimeType: string },
  headline: string,
  advantages: string[]
): Promise<GenerateImageResult> {
  const prompt = buildKvartovidCoverImagePrompt(input, headline, advantages);

  return generateNanoBananaExpertReferenceEdit({
    prompt,
    imageBase64: photo.base64,
    imageMimeType: photo.mimeType,
    aspectRatio: "4:3",
    resolution: "1k",
    outputFormat: "png",
    model: "nb2",
    contentPolicyFields: {
      productDescription: prompt,
      category: "Недвижимость",
      title: headline,
      benefits: advantages,
      infographicTexts: advantages
    }
  });
}
