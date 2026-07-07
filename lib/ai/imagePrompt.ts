import type { GenerateImageInput, ImageDesignPreset } from "@/types/product-card";
import { buildProductEnvironmentPromptBlock, buildSeriesPlanPrompt } from "@/lib/ai/cardPromptBuilder";
import { buildImageEditInstructionsBlock } from "@/lib/series/editing";

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
  const clean = cleanText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function listToLines(items: string[] | undefined, fallback: string[]): string {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  return source
    .filter(Boolean)
    .slice(0, 7)
    .map((item) => `- ${truncateText(item, 90)}`)
    .join("\n");
}

function characteristicsToLines(
  characteristics: { key: string; value: string }[] | undefined,
  fallback: string[],
): string {
  if (!Array.isArray(characteristics) || characteristics.length === 0) {
    return fallback.map((item) => `- ${item}`).join("\n");
  }

  return characteristics
    .filter((item) => item && item.key && item.value)
    .slice(0, 7)
    .map((item) => `- ${truncateText(item.key, 40)}: ${truncateText(item.value, 60)}`)
    .join("\n");
}

function detectSafeCategory(productDescription: string, category: string): string {
  const explicitCategory = cleanText(category);
  if (explicitCategory) return explicitCategory;

  const text = productDescription.toLowerCase();

  if (text.includes("статуэт") || text.includes("фигур") || text.includes("декор")) {
    return "Декор и интерьер";
  }

  if (text.includes("наушник") || text.includes("заряд") || text.includes("кабель") || text.includes("гаджет")) {
    return "Электроника";
  }

  if (text.includes("космет") || text.includes("крем") || text.includes("сыворот")) {
    return "Красота и уход";
  }

  if (text.includes("бутыл") || text.includes("спорт") || text.includes("трениров")) {
    return "Спорт и дом";
  }

  if (text.includes("рюкзак") || text.includes("сумк") || text.includes("кошелек") || text.includes("аксессуар")) {
    return "Аксессуары";
  }

  return "Другое";
}

function buildHeadline(input: GenerateImageInput): string {
  const explicitHeadline = cleanText(input.headline);
  if (explicitHeadline) return truncateText(explicitHeadline, 80);

  const title = cleanText(input.title);
  const product = cleanText(input.productDescription);
  const category = detectSafeCategory(product, input.category);

  if (title) {
    return truncateText(title.toUpperCase(), 80);
  }

  if (product) {
    return truncateText(`ПРЕМИУМ-КАРТОЧКА: ${product}`.toUpperCase(), 80);
  }

  return truncateText(`ПРЕМИУМ-ТОВАР: ${category}`.toUpperCase(), 80);
}

function getStyleDirection(style: string): string {
  const normalized = cleanText(style).toLowerCase();

  if (normalized.includes("прем")) {
    return `
Premium style direction:
- premium palette chosen for the real product environment, not a random showroom
- if the product has a natural usage scene, preserve that scene and make it feel expensive
- use studio/catalog lighting only when studio context is natural for the category
- beige, white, graphite, black glossy accents, subtle metallic feeling
- soft elegant shadows
- premium reflections
- expensive catalog look
- calm, confident, high-end composition
- the final card must look like a premium product showcase`;
  }

  if (normalized.includes("ярк")) {
    return `
Bright style direction:
- purple-blue gradient accents
- dynamic badges
- vivid commercial look
- strong contrast
- energetic marketplace advertising style
- keep the layout clean, not chaotic`;
  }

  if (normalized.includes("неж")) {
    return `
Gentle style direction:
- pastel colors
- soft shapes
- delicate shadows
- clean airy composition
- calm premium feeling
- suitable for beauty, home, gifts, accessories`;
  }

  if (normalized.includes("технолог")) {
    return `
Technological style direction:
- modern SaaS/tech look
- clean grid
- subtle glow
- thin lines
- dark or light tech background
- futuristic but still commercial and readable`;
  }

  return `
Minimalist premium style direction:
- product-relevant light neutral background, not a generic abstract surface
- clean grid
- subtle shadows
- strong typography
- restrained color accents
- premium spacing and clear hierarchy`;
}

function getPresetDirection(preset: ImageDesignPreset | undefined): string {
  if (preset === "luxury-catalog") {
    return `
Design preset: Luxury Catalog.
The image must look like a high-end catalog poster:
- editorial premium layout
- luxury product photography feeling
- elegant headline
- refined spacing
- subtle background texture
- polished product lighting
- expensive brand presentation
- no cheap marketplace clutter`;
  }

  if (preset === "standard") {
    return `
Design preset: Standard Marketplace.
The image should be clean and commercial, but still polished:
- product-centered layout
- readable benefits
- simple marketplace card structure
- clean background
- balanced composition`;
  }

  return `
Design preset: Premium Marketplace.
This is the main required style.
The image must look like an expensive, conversion-focused premium marketplace advertising creative:
- oversized bold headline at the top
- one large hero product image
- 2–4 smaller supporting preview/detail images
- structured features/specifications block
- clean background selected from the product's real environment and use case
- excellent Russian typography
- strong hierarchy
- polished e-commerce art direction
- not a simple product listing`;
}

export function buildPremiumMarketplaceImagePrompt(input: GenerateImageInput): string {
  const productDescription = cleanText(input.productDescription) || "товар";
  const category = detectSafeCategory(productDescription, input.category);
  const marketplace = cleanText(input.marketplace) || "Wildberries / Ozon / Avito";
  const style = cleanText(input.style) || "Премиальный";
  const title = cleanText(input.title) || productDescription;
  const headline = buildHeadline(input);
  const designPreset = input.designPreset || "premium-marketplace";

  const benefits = listToLines(input.benefits, [
    "Удобно каждый день",
    "Для дома и подарка",
    "Понятная польза",
    "Легко выбрать",
    "Подходит под разные задачи",
  ]);

  const infographicTexts = listToLines(input.infographicTexts, [
    "Премиальный вид",
    "Для подарка",
    "Каждый день",
    "Удобный формат",
  ]);

  const specs = characteristicsToLines(input.characteristics, [
    `Категория: ${category}`,
    `Маркетплейс: ${marketplace}`,
    `Стиль: ${style}`,
    "Формат: премиум-карточка 4:5",
    "Подача: коммерческий e-commerce creative",
  ]);

  const styleDirection = getStyleDirection(style);
  const presetDirection = getPresetDirection(designPreset);
  const productEnvironmentContext = buildProductEnvironmentPromptBlock(input);
  const seriesPlanningContext = input.seriesCardType ? buildSeriesPlanPrompt(input) : "";
  const seriesContext = input.seriesCardType
    ? `
SERIES CARD CONTEXT:
This image is one card inside a product gallery series.
Keep the same visual system across the series, but make this card focus on its own meaning.
Series style guide: ${cleanText(input.seriesStyleGuide || "единая палитра, похожие плашки, крупная типографика")}
Card type: ${cleanText(input.seriesCardType)}
Card goal: ${cleanText(input.seriesCardGoal || "раскрыть один понятный смысловой блок товара")}
Visual idea: ${cleanText(input.seriesCardVisualIdea || "крупный товар, аккуратные плашки и один главный акцент")}
Badges to use: ${listToLines(input.badges, ["Ключевой блок", "Для маркетплейса"])}
`
    : "";
  const editContext = buildImageEditInstructionsBlock(input.editInstructions);

  return `
Create a premium marketplace product card image in Russian.

MAIN GOAL:
Generate a high-end, expensive-looking, conversion-focused product card for a marketplace.
The card must look like a professionally designed premium advertising creative, not a basic marketplace listing.
This must look like a premium marketplace advertising creative, not a simple product listing.
The output must have strong hierarchy, a luxury feel, and polished e-commerce art direction.

USE THE UPLOADED PRODUCT IMAGE:
Use the uploaded reference image as the main product object.
Keep the product recognizable.
Do not replace the product with another object.
Do not distort the product shape, material, color, or core appearance.
Do not add random products.
If the reference image contains a product, it must become the hero product in the final card.

PRODUCT DATA:
Product description: ${productDescription}
Category: ${category}
Marketplace: ${marketplace}
Visual style: ${style}
Product title: ${title}
Main headline: ${headline}

BENEFITS TO USE:
${benefits}

SPECIFICATIONS / FEATURE BLOCK:
${specs}

INFOGRAPHIC TEXTS TO USE:
${infographicTexts}

${productEnvironmentContext}

${seriesPlanningContext}

${seriesContext}

REQUIRED COMPOSITION:
1. Large bold Russian headline at the top.
2. One large hero product image as the main focal point.
3. 2–4 small additional detail preview images showing close-ups, material, angle, texture, or product details.
4. A structured benefits/specifications text block.
5. Product-bound premium background with lighting and environment that match the product category and use case.
6. Clear information hierarchy and readable Russian text.
7. Visually balanced layout with enough whitespace.
8. The result must look like a polished premium sales card suitable for marketplace performance creatives.

LAYOUT RULES:
- Vertical format, aspect ratio 4:5.
- Large product on left, center-left, or center.
- Text/specifications on right or top-right.
- Small detail preview cards in a row near the middle or lower section.
- Use rounded rectangles and premium card blocks.
- Maintain strong visual rhythm and clean spacing.
- Make the product the visual center.
- Do not make the design empty.
- Do not make the design cluttered.
- Do not create a collage of unrelated items.

TYPOGRAPHY:
- All visible text must be in Russian.
- Use large bold sans-serif headline.
- Use premium modern Russian typography.
- Text must be readable.
- Important words may be visually emphasized in bold.
- Avoid tiny unreadable text.
- Avoid too much text.
- Do not create broken or random Cyrillic text.
- Use fewer words, bigger type, stronger hierarchy.

PREMIUM VISUAL REQUIREMENTS:
- expensive
- premium
- commercial
- high-end marketplace creative
- clean layout
- strong typography
- modern e-commerce design
- realistic product presentation
- soft shadows
- elegant lighting
- polished textures
- studio-quality composition only when it fits the product
- premium catalog feeling in the product's real usage environment
- background and props must support the product, not compete with it

${presetDirection}

${styleDirection}

STRICT CONTENT RULES:
- Do not invent fake certifications.
- Do not invent fake ratings.
- Do not invent fake marketplace badges.
- Do not use official Wildberries, Ozon, Avito, or Yandex Market logos.
- Do not add brand logos unless they are already present on the uploaded product image.
- Do not add watermarks.
- Do not add QR codes.
- Do not add fake discount percentages.
- Do not add price, cost, or any monetary values.
- Do not add buy buttons, CTA buttons, or "add to cart" elements.
- Do not add medical, legal, or guaranteed claims.
- Use only neutral product marketing language based on the provided data.
- If some characteristics are unknown, use neutral wording.

NEGATIVE DESIGN GUIDANCE:
- no messy layout
- no clutter
- no cheap amateur design
- no low-quality typography
- no random extra objects
- no generic abstract premium background unrelated to the product
- no random luxury showroom when the product belongs outdoors, in water, in a home, in a vehicle, or in another concrete use context
- no irrelevant product replacements
- no unreadable tiny text
- no distorted product
- no ugly stock-template look
- no chaotic collage
- no excessive stickers
- no fake marketplace UI
- no official marketplace logos
- no watermark
- no price block or price text
- no buy button or CTA button
- no "добавить в корзину" or similar purchase prompts
${editContext}

FINAL OUTPUT:
Generate only the final image.
No explanations.
No mockup frame outside the image.
No screenshots of a website.
Only the premium product card creative.
`.trim();
}

export function buildImagePrompt(input: GenerateImageInput): string {
  return buildPremiumMarketplaceImagePrompt(input);
}
