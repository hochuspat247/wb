import { GoogleGenAI } from "@google/genai";
import { buildFallbackCard } from "@/lib/ai/fallback";
import { buildCardPrompt } from "@/lib/ai/prompt";
import { callGigaChatJson } from "@/lib/ai/gigachat";
import { detectCategory } from "@/lib/category";
import { sanitizeProductCardResult } from "@/lib/contentQuality";
import { extractJsonObject } from "@/lib/json";
import type { ProductCardInput, ProductCardResult } from "@/types/product-card";

type LlmResult = Omit<ProductCardResult, "id" | "category" | "marketplace" | "style" | "generatedAt" | "provider" | "isFallback">;
type ProviderMode = "auto" | "gigachat" | "gemini" | "ollama" | "openrouter" | "huggingface" | "fallback";

function safeParseJson(text: string): LlmResult {
  const jsonText = extractJsonObject(text);
  const parsed = JSON.parse(jsonText) as Partial<LlmResult>;

  if (!parsed.title || !parsed.shortDescription || !parsed.fullDescription) {
    throw new Error("AI returned incomplete JSON");
  }

  return {
    title: String(parsed.title).slice(0, 120),
    shortDescription: String(parsed.shortDescription),
    fullDescription: String(parsed.fullDescription),
    benefits: Array.isArray(parsed.benefits) ? parsed.benefits.map(String).slice(0, 5) : [],
    characteristics: Array.isArray(parsed.characteristics)
      ? parsed.characteristics
          .map((item) => ({ key: String(item.key ?? "Параметр"), value: String(item.value ?? "Не указано") }))
          .slice(0, 7)
      : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 15) : [],
    infographicTexts: Array.isArray(parsed.infographicTexts) ? parsed.infographicTexts.map(String).slice(0, 4) : [],
    marketplaceTips: Array.isArray(parsed.marketplaceTips) ? parsed.marketplaceTips.map(String).slice(0, 3) : [],
    visualConcept: String(parsed.visualConcept ?? "Визуальная карточка на основе фото товара")
  };
}

function withMeta(base: LlmResult, input: ProductCardInput, category: string, provider: string): ProductCardResult {
  return {
    id: crypto.randomUUID(),
    ...base,
    benefits: base.benefits.length ? base.benefits : buildFallbackCard(input).benefits,
    characteristics: base.characteristics.length ? base.characteristics : buildFallbackCard(input).characteristics,
    keywords: base.keywords.length ? base.keywords : buildFallbackCard(input).keywords,
    infographicTexts: base.infographicTexts.length ? base.infographicTexts : buildFallbackCard(input).infographicTexts,
    marketplaceTips: base.marketplaceTips.length ? base.marketplaceTips : buildFallbackCard(input).marketplaceTips,
    category,
    marketplace: input.marketplace,
    style: input.style,
    generatedAt: new Date().toISOString(),
    provider,
    isFallback: false
  };
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

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}`);
  }

  const data = await response.json();
  return safeParseJson(data.message?.content ?? data.response ?? "");
}

async function callOpenRouter(prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

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

  if (!response.ok) {
    throw new Error(`OpenRouter error ${response.status}`);
  }

  const data = await response.json();
  return safeParseJson(data.choices?.[0]?.message?.content ?? "");
}

async function callHuggingFace(prompt: string) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }

  const model = process.env.HUGGINGFACE_TEXT_MODEL || "Qwen/Qwen2.5-7B-Instruct";
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 1400, temperature: 0.35, return_full_text: false }
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    throw new Error(`Hugging Face error ${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  return safeParseJson(text ?? "");
}

async function callGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Верни только валидный JSON без markdown.\n\n${prompt}`
          }
        ]
      }
    ]
  });

  return safeParseJson(response.text ?? "");
}

async function tryProvider(provider: ProviderMode, prompt: string) {
  if (provider === "gigachat") {
    return { provider: "GigaChat", result: safeParseJson(await callGigaChatJson(prompt)) };
  }

  if (provider === "gemini") {
    return { provider: "Gemini", result: await callGemini(prompt) };
  }

  if (provider === "ollama") {
    return { provider: "Ollama", result: await callOllama(prompt) };
  }

  if (provider === "openrouter") {
    return { provider: "OpenRouter", result: await callOpenRouter(prompt) };
  }

  if (provider === "huggingface") {
    return { provider: "Hugging Face", result: await callHuggingFace(prompt) };
  }

  throw new Error("Unknown provider");
}

function getProviderErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
}

export async function generateProductCard(input: ProductCardInput): Promise<ProductCardResult> {
  const category = detectCategory(input.productDescription, input.category);
  const prompt = buildCardPrompt({ ...input, category });
  const mode = (process.env.AI_PROVIDER || "auto").toLowerCase() as ProviderMode;

  if (mode === "fallback") {
    return sanitizeProductCardResult(buildFallbackCard({ ...input, category }), input);
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
      const response = await tryProvider(provider, prompt);
      return sanitizeProductCardResult(withMeta(response.result, input, category, response.provider), input);
    } catch (error) {
      console.warn(`[MarketCard AI] ${provider} unavailable: ${getProviderErrorMessage(error)}`);
    }
  }

  return sanitizeProductCardResult(buildFallbackCard({ ...input, category }), input);
}
