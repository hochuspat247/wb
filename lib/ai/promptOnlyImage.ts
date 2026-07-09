import { generateGeminiPromptImage } from "@/lib/ai/geminiImage";
import {
  generateNanoBananaExpertFromPrompt,
  isNanoBananaExpertConfigured,
  type PromptOnlyImageOptions
} from "@/lib/ai/nanobananaExpert";
import type { GenerateImageResult } from "@/types/product-card";

export async function generatePromptOnlyImage(options: PromptOnlyImageOptions): Promise<GenerateImageResult> {
  const prompt = options.prompt.trim();
  const generatedAt = new Date().toISOString();

  if (!prompt) {
    return {
      imageBase64: null,
      imageUrl: null,
      mimeType: null,
      provider: "HTML/CSS fallback",
      model: "fallback",
      prompt,
      generatedAt,
      isFallback: true,
      error: "Пустой промпт для изображения."
    };
  }

  if (isNanoBananaExpertConfigured()) {
    const nanoResult = await generateNanoBananaExpertFromPrompt(options);
    if (!nanoResult.isFallback && (nanoResult.imageBase64 || nanoResult.imageUrl)) {
      return nanoResult;
    }

    if (process.env.GEMINI_API_KEY) {
      const geminiResult = await generateGeminiPromptImage(prompt, {
        aspectRatio: options.aspectRatio || "3:4"
      });
      if (!geminiResult.isFallback && geminiResult.imageBase64) {
        return geminiResult;
      }

      return geminiResult.error ? geminiResult : nanoResult;
    }

    return nanoResult;
  }

  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider: "HTML/CSS fallback",
    model: "fallback",
    prompt,
    generatedAt,
    isFallback: true,
    error: "Генерация изображений не настроена."
  };
}
