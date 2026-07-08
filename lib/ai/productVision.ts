import { GoogleGenAI } from "@google/genai";
import { resolveCategory } from "@/lib/category";
import { extractJsonObject } from "@/lib/json";

export type ProductVisionResult = {
  productName: string;
  productType: string;
  category: string;
  brand?: string;
  visibleFeatures: string[];
  packagingNotes?: string;
  confidence: "high" | "medium" | "low";
};

export type ResolvedProductContext = {
  productDescription: string;
  category: string;
  brand?: string;
  sellerWishes?: string;
  identifiedProductName?: string;
  vision?: ProductVisionResult;
};

type RawVisionJson = Partial<ProductVisionResult> & {
  visibleFeatures?: unknown;
};

function safeParseVisionJson(text: string): ProductVisionResult {
  const parsed = JSON.parse(extractJsonObject(text)) as RawVisionJson;

  const productName = String(parsed.productName ?? "").trim();
  const productType = String(parsed.productType ?? "").trim();

  if (!productName && !productType) {
    throw new Error("Vision returned empty product identity");
  }

  const visibleFeatures = Array.isArray(parsed.visibleFeatures)
    ? parsed.visibleFeatures.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8)
    : [];

  const confidence = parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
    ? parsed.confidence
    : productName ? "medium" : "low";

  return {
    productName: productName || productType,
    productType: productType || productName,
    category: resolveCategory({
      description: "",
      productName,
      productType,
      category: String(parsed.category ?? "").trim() || undefined
    }),
    brand: parsed.brand ? String(parsed.brand).trim() : undefined,
    visibleFeatures,
    packagingNotes: parsed.packagingNotes ? String(parsed.packagingNotes).trim() : undefined,
    confidence
  };
}

function buildVisionPrompt() {
  return `Ты анализируешь фото товара для карточки маркетплейса.
Определи, ЧТО именно изображено на фото: тип товара, название, бренд (если виден), ключевые видимые свойства.
Категорию выбирай по САМОМУ ТОВАРУ, а не по фону, декорациям или lifestyle-сцене.
Если на фото наушники на яхте — это "Электроника", а не "Водный транспорт".
Если на фото шоколад на столе — это "Продукты питания", а не "Декор и интерьер".
Не придумывай то, чего не видно. Если упаковка частично закрыта — пиши только по видимому.
Верни только JSON без markdown:
{
  "productName": "конкретное название товара на русском",
  "productType": "тип товара на русском",
  "category": "категория для маркетплейса на русском",
  "brand": "бренд или null",
  "visibleFeatures": ["свойство 1", "свойство 2"],
  "packagingNotes": "кратко про упаковку или null",
  "confidence": "high|medium|low"
}`;
}

export async function identifyProductFromImage(
  imageBase64: string,
  imageMimeType: string
): Promise<ProductVisionResult | null> {
  if (!process.env.GEMINI_API_KEY || !imageBase64 || !imageMimeType) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_VISION_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: buildVisionPrompt() },
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    return safeParseVisionJson(response.text ?? "");
  } catch (error) {
    console.warn("[MarketCard AI] product vision failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

function buildFactualDescription(vision: ProductVisionResult) {
  const parts = [vision.productName];

  if (vision.productType && vision.productType.toLowerCase() !== vision.productName.toLowerCase()) {
    parts.push(vision.productType);
  }

  if (vision.visibleFeatures.length) {
    parts.push(vision.visibleFeatures.join(". "));
  }

  if (vision.packagingNotes) {
    parts.push(vision.packagingNotes);
  }

  return parts.join(". ").replace(/\.\s*\./g, ".").trim();
}

export function resolveProductContext(
  input: { productDescription: string; category?: string; brand?: string },
  vision: ProductVisionResult | null
): ResolvedProductContext {
  const userText = input.productDescription.trim();

  if (!vision || vision.confidence === "low") {
    return {
      productDescription: userText,
      category: resolveCategory({
        description: userText,
        category: input.category
      }),
      brand: input.brand,
      sellerWishes: undefined,
      identifiedProductName: undefined,
      vision: vision ?? undefined
    };
  }

  const category = resolveCategory({
    description: userText,
    productName: vision.productName,
    productType: vision.productType,
    category: input.category?.trim() || vision.category
  });

  return {
    productDescription: buildFactualDescription(vision),
    category,
    brand: input.brand?.trim() || vision.brand,
    sellerWishes: userText || undefined,
    identifiedProductName: vision.productName,
    vision
  };
}

export async function resolveProductContextFromImage(input: {
  productDescription: string;
  category?: string;
  brand?: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<ResolvedProductContext> {
  if (!input.imageBase64 || !input.imageMimeType) {
    return resolveProductContext(input, null);
  }

  const vision = await identifyProductFromImage(input.imageBase64, input.imageMimeType);
  return resolveProductContext(input, vision);
}
