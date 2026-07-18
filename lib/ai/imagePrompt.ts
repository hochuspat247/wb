import type { GenerateImageInput, ImageDesignPreset } from "@/types/product-card";
import { buildProductEnvironmentPromptBlock, buildSeriesPlanPrompt } from "@/lib/ai/cardPromptBuilder";
import { buildImageEditInstructionsBlock } from "@/lib/series/editing";

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

const FORBIDDEN_VISIBLE_TEXT_PATTERNS = [
  /\bphotos?\b/gi,
  /\bimages?\b/gi,
  /\bpictures?\b/gi,
  /\bhigh\s+quality\b/gi,
  /\bhigh\s+resolution\b/gi,
  /\bhd\b/gi,
  /\b4k\b/gi,
  /фотографи[а-яё]*/giu,
  /(^|[^а-яё])фото(?=$|[^а-яё])/giu,
  /картинк[а-яё]*/giu,
  /изображени[а-яё]*/giu,
  /в\s+высок[а-яё]*\s+качеств[а-яё]*/giu,
  /в\s+хорош[а-яё]*\s+качеств[а-яё]*/giu,
  /высок[а-яё]*\s+качеств[а-яё]*/giu,
  /хорош[а-яё]*\s+качеств[а-яё]*/giu,
  /в\s+высок[а-яё]*\s+разрешени[а-яё]*/giu,
  /высок[а-яё]*\s+разрешени[а-яё]*/giu,
  /hd[-\s]?качеств[а-яё]*/giu,
  /4k[-\s]?качеств[а-яё]*/giu,
  /продающ[а-яё]*\s+обложк[а-яё]*/giu,
  /обложк[а-яё]*\s+для\s+(wildberries|wb|ozon|avito|яндекс)/giu,
  /для\s+(wildberries|wb|ozon|avito|яндекс\s*маркета?)/giu,
  /понятн[а-яё]*\s+перв[а-яё]*\s+экран[а-яё]*/giu,
  /акцент\s+на\s+главн[а-яё]*/giu,
  /крупн[а-яё]*\s+товар[а-яё]*/giu,
  /хит\s+для\s+каталог[а-яё]*/giu,
];

function sanitizeVisibleImageText(value: unknown): string {
  let text = cleanText(value);

  for (const pattern of FORBIDDEN_VISIBLE_TEXT_PATTERNS) {
    text = text.replace(pattern, (match, prefix: string | undefined) => {
      if (typeof prefix === "string" && prefix.length > 0 && !/[а-яё]/iu.test(prefix)) {
        return prefix;
      }

      return "";
    });
  }

  return text
    .replace(/\s+([,.:;!?])/g, "$1")
    .replace(/[|/\\]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.:;!?-]+|[\s,.:;!?-]+$/g, "")
    .trim();
}

function truncateText(value: string, maxLength: number): string {
  const clean = cleanText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function listToLines(items: string[] | undefined, fallback: string[], maxItems = 5): string {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  const sanitized = source
    .map(sanitizeVisibleImageText)
    .filter(Boolean);
  const safeSource = sanitized.length > 0 ? sanitized : fallback.map(sanitizeVisibleImageText).filter(Boolean);

  return safeSource
    .slice(0, maxItems)
    .map((item) => `- ${truncateText(item, 90)}`)
    .join("\n");
}

function characteristicsToLines(
  characteristics: { key: string; value: string }[] | undefined,
  fallback: string[],
  maxItems = 5,
): string {
  if (!Array.isArray(characteristics) || characteristics.length === 0) {
    return fallback
      .map(sanitizeVisibleImageText)
      .filter(Boolean)
      .slice(0, maxItems)
      .map((item) => `- ${item}`)
      .join("\n");
  }

  const safeCharacteristics = characteristics
    .filter((item) => item && item.key && item.value)
    .map((item) => ({
      key: sanitizeVisibleImageText(item.key),
      value: sanitizeVisibleImageText(item.value),
    }))
    .filter((item) => item.key && item.value);

  if (!safeCharacteristics.length) {
    return fallback
      .map(sanitizeVisibleImageText)
      .filter(Boolean)
      .slice(0, maxItems)
      .map((item) => `- ${item}`)
      .join("\n");
  }

  return safeCharacteristics
    .slice(0, maxItems)
    .map((item) => `- ${truncateText(item.key, 40)}: ${truncateText(item.value, 60)}`)
    .join("\n");
}

function detectSafeCategory(productDescription: string, category: string): string {
  const explicitCategory = sanitizeVisibleImageText(category);
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
  const explicitHeadline = sanitizeVisibleImageText(input.headline);
  if (explicitHeadline) return truncateText(explicitHeadline, 80);

  const title = sanitizeVisibleImageText(input.title);
  const product = sanitizeVisibleImageText(input.productDescription);
  const category = detectSafeCategory(product, input.category);

  if (title) {
    return truncateText(title.toUpperCase(), 80);
  }

  if (product) {
    return truncateText(product.toUpperCase(), 80);
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
- optional 1–3 smaller supporting detail previews only when they make the product clearer
- short structured benefits/specifications block with only the strongest information
- clean background selected from the product's real environment and use case
- excellent Russian typography
- strong hierarchy
- editorial art direction
- premium spacing and margins
- polished e-commerce art direction
- not a simple product listing`;
}

type BackgroundReplacementRequest = {
  request: string;
  allowVisibleText: boolean;
};

const BACKGROUND_TARGET_PATTERNS = [
  /(?:replace|change|swap|remove)[^.!?\n]{0,80}\bbackground\b[^.!?\n]{0,80}\b(?:with|to|for)\b\s+([^.!?\n]+)/i,
  /\bbackground\b[^.!?\n]{0,40}(?:replace|change|swap)[^.!?\n]{0,40}\b(?:with|to|for)\b\s+([^.!?\n]+)/i,
  /(?:\u0437\u0430\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u044c|\u0438\u0442\u0435)|\u043f\u043e\u043c\u0435\u043d(?:\u044f\u0439|\u044f\u0442\u044c|\u044f\u0439\u0442\u0435)|\u0441\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u044c|\u0438\u0442\u0435)|\u0443\u0431\u0435\u0440(?:\u0438|\u0430\u0442\u044c|\u0438\u0442\u0435)|\u0443\u0434\u0430\u043b(?:\u0438|\u0438\u0442\u044c|\u0438\u0442\u0435))[^.!?\n]{0,80}(?:\u0444\u043e\u043d|\u0437\u0430\u0434\u043d[^\s.!?]*\s+\u0444\u043e\u043d)[^.!?\n]{0,80}\s+\u043d\u0430\s+([^.!?\n]+)/iu,
  /(?:\u0444\u043e\u043d|\u0437\u0430\u0434\u043d[^\s.!?]*\s+\u0444\u043e\u043d)[^.!?\n]{0,50}(?:\u0437\u0430\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u044c|\u0438\u0442\u0435)|\u043f\u043e\u043c\u0435\u043d(?:\u044f\u0439|\u044f\u0442\u044c|\u044f\u0439\u0442\u0435)|\u0441\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u044c|\u0438\u0442\u0435))[^.!?\n]{0,50}\s+\u043d\u0430\s+([^.!?\n]+)/iu,
];

const VISIBLE_TEXT_REQUEST_PATTERN =
  /\b(?:text|caption|label|headline|title|write|add\s+words)\b|(?:\u0442\u0435\u043a\u0441\u0442|\u043d\u0430\u0434\u043f\u0438\u0441|\u0437\u0430\u0433\u043e\u043b\u043e\u0432|\u043d\u0430\u043f\u0438\u0448|\u0434\u043e\u0431\u0430\u0432[^\s]*\s+\u0441\u043b\u043e\u0432|\u0434\u043e\u0431\u0430\u0432[^\s]*\s+\u0444\u0440\u0430\u0437)/iu;

const NO_VISIBLE_TEXT_PATTERN =
  /\b(?:no\s+text|without\s+text|do\s+not\s+add\s+text)\b|(?:\u0431\u0435\u0437\s+\u0442\u0435\u043a\u0441\u0442|\u043d\u0435\s+\u0434\u043e\u0431\u0430\u0432[^\s]*\s+\u0442\u0435\u043a\u0441\u0442|\u0442\u0435\u043a\u0441\u0442\s+\u043d\u0435\s+\u0434\u043e\u0431\u0430\u0432)/iu;

function getBackgroundReplacementRequest(input: GenerateImageInput): BackgroundReplacementRequest | null {
  const candidates = [
    input.editInstructions,
    input.productDescription,
    input.headline,
    input.title
  ]
    .map(cleanText)
    .filter(Boolean);

  for (const candidate of candidates) {
    for (const pattern of BACKGROUND_TARGET_PATTERNS) {
      const match = candidate.match(pattern);
      const target = cleanText(match?.[1]);

      if (target.length >= 2) {
        return {
          request: candidate,
          allowVisibleText: VISIBLE_TEXT_REQUEST_PATTERN.test(candidate) && !NO_VISIBLE_TEXT_PATTERN.test(candidate)
        };
      }
    }
  }

  return null;
}

function buildBackgroundReplacementPrompt(input: GenerateImageInput, backgroundRequest: BackgroundReplacementRequest): string {
  const aspectRatio = cleanText(input.aspectRatio) || "4:5";
  const outputStyle = cleanText(input.style) || "premium natural photo edit";
  const visibleTextRule = backgroundRequest.allowVisibleText
    ? "Only add the exact visible text explicitly requested by the user. Do not invent extra labels, side descriptions, specs, badges, icons, UI panels, or marketing copy."
    : "Do not add any visible text at all: no headline, no labels, no side descriptions, no badges, no specs, no UI panels, no infographics.";

  return `
Edit the uploaded image as a clean background replacement.

USER BACKGROUND REQUEST:
${backgroundRequest.request}

MAIN TASK:
- Isolate the main foreground subject from the uploaded reference image.
- Remove the original background completely.
- Replace it with the background requested by the user.
- Keep the main subject recognizable and faithful to the uploaded image.
- Preserve identity, face, pose, clothing, product shape, materials, colors, proportions, and important details.
- Do not turn the result into a marketplace card, brochure, flyer, poster, service ad, or template.
- Do not add side information blocks or explanatory design elements unless the user explicitly requested them.

BACKGROUND AND LIGHTING:
- Match the new background to the subject with realistic scale, perspective, shadows, reflections, and color temperature.
- If the requested background is a plain color or simple studio background, make it clean, seamless, and professional.
- If the requested background is a scene, make it photorealistic and believable without distracting from the subject.
- Keep the final composition natural, polished, and commercially usable.
- Visual style: ${outputStyle}.
- Aspect ratio: ${aspectRatio}.

STRICT RULES:
- ${visibleTextRule}
- No random extra people, products, thumbnails, icons, arrows, frames, screenshots, or collage elements.
- No visible watermarks, QR codes, marketplace logos, prices, buy buttons, or fake UI.
- No descriptions beside the subject.
- No before/after layout.

FINAL OUTPUT:
Generate only the edited final image.
No explanations.
No mockup frame outside the image.
`.trim();
}

export function buildPremiumMarketplaceImagePrompt(input: GenerateImageInput): string {
  const productDescription = sanitizeVisibleImageText(input.productDescription) || "товар";
  const category = detectSafeCategory(productDescription, input.category);
  const marketplace = cleanText(input.marketplace) || "Wildberries / Ozon / Avito";
  const style = cleanText(input.style) || "Премиальный";
  const title = sanitizeVisibleImageText(input.title) || productDescription;
  const headline = buildHeadline(input);
  const designPreset = input.designPreset || "premium-marketplace";

  const benefits = listToLines(input.benefits, [
    "Удобно каждый день",
    "Для дома и подарка",
    "Понятная польза",
    "Легко выбрать",
    "Подходит под разные задачи",
  ], 4);

  const infographicTexts = listToLines(input.infographicTexts, [
    "Премиальный вид",
    "Для подарка",
    "Каждый день",
    "Удобный формат",
  ], 3);

  const specs = characteristicsToLines(input.characteristics, [
    `Категория: ${category}`,
    `Маркетплейс: ${marketplace}`,
    `Стиль: ${style}`,
    "Формат: премиум-карточка 4:5",
    "Подача: коммерческий e-commerce creative",
  ], 4);

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
  const isLayoutLock = /LAYOUT_LOCK_FROM_SAMPLE/i.test(input.editInstructions || "");

  const compositionBlock = isLayoutLock
    ? `REQUIRED COMPOSITION (LAYOUT LOCK):
1. Match the SAMPLE card layout described in LAYOUT LOCK as closely as possible.
2. Keep the same grid: headline placement, hero product placement, side/specs blocks, badges, thumbnail strip if present.
3. Do NOT switch to a different marketplace template.
4. Only swap the product (from uploaded photo) and rewrite visible texts for the new product.
5. Keep the same visual density, margins, and premium art direction as the sample.
6. The result must look like the next card in the same design system, not a redesign.`
    : `REQUIRED COMPOSITION:
1. Large bold Russian headline at the top.
2. One large hero product image as the main focal point.
3. Optional 1–3 small detail previews only if they improve trust or explain the product.
4. One compact benefits/specifications block, not a long table.
5. Product-bound premium background with lighting and environment that match the product category and use case.
6. Clear information hierarchy and readable Russian text.
7. Visually balanced layout with enough whitespace.
8. The result must look like a polished premium sales card suitable for marketplace performance creatives.
9. The card must feel intentionally designed, not assembled from random template parts.`;

  const layoutRulesBlock = isLayoutLock
    ? `LAYOUT RULES (LAYOUT LOCK):
- Vertical format, aspect ratio 4:5.
- Clone sample block positions first; default left/right template rules are secondary.
- Keep the same badge/chip style and spacing language as the sample.
- Do not invent extra panels that the sample did not have.
- Do not remove signature blocks from the sample.
- Make the uploaded product the hero, but keep the sample's frame and composition.`
    : `LAYOUT RULES:
- Vertical format, aspect ratio 4:5.
- Large product on left, center-left, or center.
- Text/specifications on right or top-right.
- Use a clean editorial grid with consistent margins and aligned edges.
- Keep generous safe margins around the headline and main product.
- Small detail previews may be in a neat row or column, but only when visually useful.
- Use rounded rectangles and premium card blocks sparingly; they must look integrated, not like pasted widgets.
- Maintain strong visual rhythm and clean spacing.
- Make the product the visual center.
- Do not make the design empty.
- Do not make the design cluttered.
- Do not create a collage of unrelated items.
- Do not create large beige/yellow info panels unless they look like refined premium packaging or editorial layout.
- Do not stack many boxes, icons, badges, and thumbnails in every corner.
- Avoid template-like brochure composition with a huge title, a large text table, three icons at the bottom, and unrelated preview photos.`;

  return `
Create a premium marketplace product card image in Russian.

MAIN GOAL:
Generate a high-end, expensive-looking, conversion-focused product card for a marketplace.
The card must look like a professionally designed premium advertising creative, not a basic marketplace listing.
This must look like a premium marketplace advertising creative, not a simple product listing.
The output must have strong hierarchy, a luxury feel, and polished e-commerce art direction.
Think like a senior marketplace art director: fewer elements, better composition, confident typography, clean spacing, expensive visual taste.

USE THE UPLOADED PRODUCT IMAGE:
Use the uploaded reference image as the main product object.
Keep the product recognizable.
Do not replace the product with another object.
Do not distort the product shape, material, color, or core appearance.
Do not add random products.
If the reference image contains a product, it must become the hero product in the final card.

PRODUCT INTERPRETATION:
- First decide what the actual sellable product is: physical item, package, clothing, cosmetic bottle, gadget, poster, wall art, decor, service visual, or another product type.
- If the product is a poster, print, artwork, card, decor panel, wall art, or image-on-material, show it as the sellable physical object: framed poster, canvas, print sheet, mounted panel, or interior mockup. Do not turn the artwork subject into a standalone character or unrelated scene.
- If the reference contains a design printed on the product, preserve that design as printed content on the product.
- Supporting images must come from the same product: close-up, material, packaging, scale, use case, or interior/use mockup.
- Do not invent random lifestyle photos, people, rooms, thumbnails, or unrelated product variants.

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

${compositionBlock}

${layoutRulesBlock}

TYPOGRAPHY:
- All visible text must be in Russian.
- Use large bold sans-serif headline.
- Use premium modern Russian typography.
- Text must be readable.
- Important words may be visually emphasized in bold.
- Avoid tiny unreadable text.
- Avoid too much text.
- Do not create broken or random Cyrillic text.
- Never invent misspellings (e.g. "КАЧТЕВО" instead of "КАЧЕСТВО").
- Keep a safe zone: at least 6% margin from all edges; never clip headlines at the top.
- Headline max ~32 characters when possible; prefer wrapping to 2 short lines over clipping.
- NEVER write service/meta phrases on the image: "Продающая обложка", "для Wildberries", "для WB", "для Ozon", "понятный первый экран", "хит для каталога", "акцент на главной выгоде".
- Visible text must describe the PRODUCT only, never the marketplace, SEO, or layout instructions.
- Use fewer words, bigger type, stronger hierarchy.
- Prefer 1 headline, 2–4 short benefit lines, and at most 3 short specs unless the card type specifically requires technical detail.
- Keep line lengths short and balanced.
- Do not render paragraph-like blocks of tiny copy.
- Do not use awkward literal labels like "Категория:", "Материал:", "Размер:" if a cleaner premium phrasing would look better.
- Do not write "премиум" / "премиальный" on the card unless the seller explicitly asked for it.
- Never invent product specs that are not in the input.
- Never put SEO/search-query text on the image.
- Never render phrases like "фотографии", "фото", "картинки", "изображения", "в высоком качестве", "в хорошем качестве", "в высоком разрешении", "HD", or "4K" as visible text, even if the user provided them.
- If the user provided a search-like phrase such as "фотографии автопарфюма в высоком качестве", extract only the actual product name and write a clean product headline like "АВТОПАРФЮМ".

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
- tasteful color palette with contrast and depth, not a flat one-color template
- polished photo-realistic product lighting or polished high-end illustration only when illustration is appropriate for the product
- refined shadows, realistic contact shadows, and believable material detail

ART DIRECTION QUALITY GATE:
- Before finalizing, mentally compare the card to premium Wildberries/Ozon top-category creatives and boutique catalog ads.
- If the image looks like a school poster, cheap Canva template, busy brochure, or random collage, simplify it and make it more premium.
- The first glance must clearly answer: what is the product, why it is attractive, and what the strongest benefit is.
- The final design should be beautiful even if the viewer does not read every word.
- No accidental visual noise, mismatched image styles, inconsistent icon sets, or floating elements without alignment.

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
- no random people or portrait thumbnails unless the uploaded product itself requires a human model
- no unrelated room mockups, lifestyle photos, or screenshots
- no generic abstract premium background unrelated to the product
- no random luxury showroom when the product belongs outdoors, in water, in a home, in a vehicle, or in another concrete use context
- no irrelevant product replacements
- no unreadable tiny text
- no distorted product
- no ugly stock-template look
- no chaotic collage
- no busy brochure template
- no oversized info table
- no bottom row of generic icons unless the icons are elegant, minimal, and actually useful
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
  const backgroundReplacementRequest = getBackgroundReplacementRequest(input);

  if (backgroundReplacementRequest) {
    return buildBackgroundReplacementPrompt(input, backgroundReplacementRequest);
  }

  return buildPremiumMarketplaceImagePrompt(input);
}
