import { GoogleGenAI } from "@google/genai";
import { callGigaChatJson } from "@/lib/ai/gigachat";
import { sanitizeMarketplaceTextResult } from "@/lib/contentQuality";
import { extractJsonObject } from "@/lib/json";
import { generateMarketplaceTextFallback } from "@/lib/marketplace/textFallback";
import { buildMarketplaceTextPrompt } from "@/lib/marketplace/textPrompt";
import { collectTextForModerationScan, scanForbiddenWords } from "@/lib/marketplace/utils";
import type {
  AvitoTextData,
  MarketplaceTextInput,
  MarketplaceTextResult,
  OzonTextData,
  WildberriesTextData,
  YandexMarketTextData
} from "@/types/marketplace";

type ProviderMode = "auto" | "gigachat" | "gemini" | "ollama" | "openrouter" | "huggingface" | "fallback";

type RawMarketplaceJson = Partial<Omit<MarketplaceTextResult, "platform" | "mode">> & {
  platformSpecific?: {
    wildberries?: WildberriesTextData | null;
    ozon?: OzonTextData | null;
    avito?: AvitoTextData | null;
    yandexMarket?: YandexMarketTextData | null;
  };
};

function parseCharacteristics(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      key: String((item as { key?: string }).key ?? "Параметр"),
      value: String((item as { value?: string }).value ?? "Не указано")
    }))
    .slice(0, 12);
}

function safeParseMarketplaceJson(text: string): RawMarketplaceJson {
  const jsonText = extractJsonObject(text);
  const parsed = JSON.parse(jsonText) as RawMarketplaceJson;

  if (!parsed.title || !parsed.fullDescription) {
    throw new Error("AI returned incomplete marketplace JSON");
  }

  return {
    title: String(parsed.title).slice(0, 120),
    shortTitle: String(parsed.shortTitle ?? parsed.title).slice(0, 80),
    seoTitle: String(parsed.seoTitle ?? parsed.title).slice(0, 120),
    shortDescription: String(parsed.shortDescription ?? parsed.fullDescription).slice(0, 300),
    fullDescription: String(parsed.fullDescription),
    advantages: Array.isArray(parsed.advantages) ? parsed.advantages.map(String).slice(0, 8) : [],
    characteristics: parseCharacteristics(parsed.characteristics),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 15) : [],
    imageTexts: Array.isArray(parsed.imageTexts) ? parsed.imageTexts.map(String).slice(0, 8) : [],
    infographicTexts: Array.isArray(parsed.infographicTexts) ? parsed.infographicTexts.map(String).slice(0, 8) : [],
    platformFields: {
      category: String(parsed.platformFields?.category ?? ""),
      brand: parsed.platformFields?.brand ? String(parsed.platformFields.brand) : undefined,
      sellerSku: parsed.platformFields?.sellerSku ? String(parsed.platformFields.sellerSku) : undefined,
      color: parsed.platformFields?.color ? String(parsed.platformFields.color) : undefined,
      size: parsed.platformFields?.size ? String(parsed.platformFields.size) : undefined,
      material: parsed.platformFields?.material ? String(parsed.platformFields.material) : undefined,
      dimensions: parsed.platformFields?.dimensions ? String(parsed.platformFields.dimensions) : undefined,
      weight: parsed.platformFields?.weight ? String(parsed.platformFields.weight) : undefined,
      packageContents: parsed.platformFields?.packageContents
        ? String(parsed.platformFields.packageContents)
        : undefined
    },
    platformSpecific: parsed.platformSpecific ?? {},
    moderationWarnings: Array.isArray(parsed.moderationWarnings) ? parsed.moderationWarnings.map(String) : [],
    improvementTips: Array.isArray(parsed.improvementTips) ? parsed.improvementTips.map(String) : [],
    exportChecklist: Array.isArray(parsed.exportChecklist) ? parsed.exportChecklist.map(String) : []
  };
}

function normalizePlatformSpecific(
  input: MarketplaceTextInput,
  raw: RawMarketplaceJson,
  fallback: MarketplaceTextResult
): MarketplaceTextResult["platformSpecific"] {
  const base = { wildberries: null, ozon: null, avito: null, yandexMarket: null };

  if (input.platform === "wildberries") {
    const wb = raw.platformSpecific?.wildberries ?? fallback.platformSpecific.wildberries;
    return { ...base, wildberries: wb ?? fallback.platformSpecific.wildberries };
  }
  if (input.platform === "ozon") {
    const oz = raw.platformSpecific?.ozon ?? fallback.platformSpecific.ozon;
    return { ...base, ozon: oz ?? fallback.platformSpecific.ozon };
  }
  if (input.platform === "avito") {
    const av = raw.platformSpecific?.avito ?? fallback.platformSpecific.avito;
    return { ...base, avito: av ?? fallback.platformSpecific.avito };
  }
  const ym = raw.platformSpecific?.yandexMarket ?? fallback.platformSpecific.yandexMarket;
  return { ...base, yandexMarket: ym ?? fallback.platformSpecific.yandexMarket };
}

function enrichModerationWarnings(result: MarketplaceTextResult): MarketplaceTextResult {
  const warnings = [...result.moderationWarnings];

  if (result.mode === "promo_creative") {
    if (!warnings.some((w) => w.includes("Промо-режим"))) {
      warnings.push("Промо-режим: проверьте правила площадки перед загрузкой");
    }
  }

  if (result.mode === "marketplace_safe" && (result.platform === "wildberries" || result.platform === "yandex_market")) {
    const found = scanForbiddenWords(collectTextForModerationScan(result));
    for (const word of found) {
      const msg = `Обнаружено потенциально запрещённое слово для safe-режима: «${word}»`;
      if (!warnings.includes(msg)) {
        warnings.push(msg);
      }
    }
  }

  return { ...result, moderationWarnings: warnings };
}

function withMeta(raw: RawMarketplaceJson, input: MarketplaceTextInput, isFallback: boolean): MarketplaceTextResult {
  const fallback = generateMarketplaceTextFallback(input);
  const platformSpecific = normalizePlatformSpecific(input, raw, fallback);

  const result: MarketplaceTextResult = {
    platform: input.platform,
    mode: input.mode,
    title: raw.title || fallback.title,
    shortTitle: raw.shortTitle || fallback.shortTitle,
    seoTitle: raw.seoTitle || fallback.seoTitle,
    shortDescription: raw.shortDescription || fallback.shortDescription,
    fullDescription: raw.fullDescription || fallback.fullDescription,
    advantages: raw.advantages?.length ? raw.advantages : fallback.advantages,
    characteristics: raw.characteristics?.length ? raw.characteristics : fallback.characteristics,
    keywords: raw.keywords?.length ? raw.keywords : fallback.keywords,
    imageTexts: raw.imageTexts?.length ? raw.imageTexts : fallback.imageTexts,
    infographicTexts: raw.infographicTexts?.length ? raw.infographicTexts : fallback.infographicTexts,
    platformFields: {
      category: raw.platformFields?.category || fallback.platformFields.category,
      brand: raw.platformFields?.brand || fallback.platformFields.brand,
      sellerSku: raw.platformFields?.sellerSku || fallback.platformFields.sellerSku,
      color: raw.platformFields?.color || fallback.platformFields.color,
      size: raw.platformFields?.size || fallback.platformFields.size,
      material: raw.platformFields?.material || fallback.platformFields.material,
      dimensions: raw.platformFields?.dimensions || fallback.platformFields.dimensions,
      weight: raw.platformFields?.weight || fallback.platformFields.weight,
      packageContents: raw.platformFields?.packageContents || fallback.platformFields.packageContents
    },
    platformSpecific,
    moderationWarnings: raw.moderationWarnings?.length ? raw.moderationWarnings : fallback.moderationWarnings,
    improvementTips: raw.improvementTips?.length ? raw.improvementTips : fallback.improvementTips,
    exportChecklist: raw.exportChecklist?.length ? raw.exportChecklist : fallback.exportChecklist
  };

  if (isFallback) {
    return sanitizeMarketplaceTextResult(enrichModerationWarnings(fallback), input);
  }

  return sanitizeMarketplaceTextResult(enrichModerationWarnings(result), input);
}

async function callOllama(prompt: string) {
  const response = await fetch(process.env.OLLAMA_URL || "http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
      stream: false,
      messages: [
        { role: "system", content: "Ты возвращаешь только валидный JSON." },
        { role: "user", content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) throw new Error(`Ollama error ${response.status}`);
  const data = await response.json();
  return safeParseMarketplaceJson(data.message?.content ?? data.response ?? "");
}

async function callOpenRouter(prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://marketcard-ai.local",
      "X-Title": "MarketCard AI"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: "Ты возвращаешь только валидный JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.45
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`OpenRouter error ${response.status}`);
  const data = await response.json();
  return safeParseMarketplaceJson(data.choices?.[0]?.message?.content ?? "");
}

async function callHuggingFace(prompt: string) {
  if (!process.env.HUGGINGFACE_API_KEY) throw new Error("HUGGINGFACE_API_KEY is not set");

  const model = process.env.HUGGINGFACE_TEXT_MODEL || "Qwen/Qwen2.5-7B-Instruct";
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 2000, temperature: 0.35, return_full_text: false }
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) throw new Error(`Hugging Face error ${response.status}`);
  const data = await response.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  return safeParseMarketplaceJson(text ?? "");
}

async function callGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Верни только валидный JSON без markdown.\n\n${prompt}` }] }]
  });

  return safeParseMarketplaceJson(response.text ?? "");
}

async function tryProvider(provider: ProviderMode, prompt: string) {
  if (provider === "gigachat") return safeParseMarketplaceJson(await callGigaChatJson(prompt, { maxTokens: 3000 }));
  if (provider === "gemini") return callGemini(prompt);
  if (provider === "ollama") return callOllama(prompt);
  if (provider === "openrouter") return callOpenRouter(prompt);
  if (provider === "huggingface") return callHuggingFace(prompt);
  throw new Error("Unknown provider");
}

export async function generateMarketplaceText(input: MarketplaceTextInput): Promise<MarketplaceTextResult> {
  const prompt = buildMarketplaceTextPrompt(input);
  const mode = (process.env.AI_PROVIDER || "auto").toLowerCase() as ProviderMode;

  if (mode === "fallback") {
    return sanitizeMarketplaceTextResult(generateMarketplaceTextFallback(input), input);
  }

  const queue: ProviderMode[] =
    mode === "auto"
      ? ["gigachat", "gemini", "ollama", "openrouter", "huggingface"]
      : mode === "gigachat"
        ? ["gigachat", "openrouter", "huggingface", "ollama"]
      : mode === "gemini" ||
          mode === "ollama" ||
          mode === "openrouter" ||
          mode === "huggingface"
        ? [mode]
        : ["gigachat", "gemini", "ollama", "openrouter", "huggingface"];

  for (const provider of queue) {
    try {
      const raw = await tryProvider(provider, prompt);
      return withMeta(raw, input, false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      console.warn(`[MarketCard AI] marketplace text ${provider} unavailable: ${msg}`);
    }
  }

  return sanitizeMarketplaceTextResult(generateMarketplaceTextFallback(input), input);
}
