import { generateGeminiPromptImage } from "@/lib/ai/geminiImage";
import {
  createImageGenerationError,
  isGeminiConfigured,
  isPromptImageGeminiFallbackEnabled,
  summarizeImageGenerationErrors
} from "@/lib/ai/imageGenerationErrors";
import {
  generateNanoBananaExpertFromPrompt,
  isNanoBananaExpertConfigured,
  type PromptOnlyImageOptions
} from "@/lib/ai/nanobananaExpert";
import type { GenerateImageResult } from "@/types/product-card";

type PromptImageProvider = "auto" | "nanobanana_expert" | "gemini";

function isSuccessfulImageResult(result: GenerateImageResult) {
  return !result.isFallback && Boolean(result.imageBase64 || result.imageUrl);
}

function getPromptImageProvider(): PromptImageProvider {
  const fromEnv = (process.env.PROMPT_IMAGE_PROVIDER || process.env.IMAGE_PROVIDER || "auto").trim();

  if (fromEnv === "nanobanana_expert" || fromEnv === "gemini") {
    return fromEnv;
  }

  return "auto";
}

export async function generatePromptOnlyImage(options: PromptOnlyImageOptions): Promise<GenerateImageResult> {
  const prompt = options.prompt.trim();

  if (!prompt) {
    return createImageGenerationError("Prompt image", prompt, "Пустой промпт для изображения.");
  }

  const provider = getPromptImageProvider();
  const nanoConfigured = isNanoBananaExpertConfigured();
  const geminiConfigured = isGeminiConfigured();
  const providerErrors: string[] = [];

  const shouldUseNano = provider === "nanobanana_expert" || (provider === "auto" && nanoConfigured);
  const shouldUseGemini =
    provider === "gemini" ||
    (provider === "auto" && geminiConfigured && (!nanoConfigured || isPromptImageGeminiFallbackEnabled()));

  if (shouldUseNano) {
    const nanoResult = await generateNanoBananaExpertFromPrompt(options);
    if (isSuccessfulImageResult(nanoResult)) {
      return nanoResult;
    }

    if (nanoResult.error) {
      providerErrors.push(nanoResult.error);
    }

    if (provider === "nanobanana_expert" || (nanoConfigured && !shouldUseGemini)) {
      return createImageGenerationError(
        "NanoBanana Expert",
        prompt,
        summarizeImageGenerationErrors(providerErrors)
      );
    }
  }

  if (shouldUseGemini) {
    const geminiResult = await generateGeminiPromptImage(prompt, {
      aspectRatio: options.aspectRatio || "3:4"
    });

    if (isSuccessfulImageResult(geminiResult)) {
      return geminiResult;
    }

    if (geminiResult.error) {
      providerErrors.push(geminiResult.error);
    }
  }

  if (!nanoConfigured && !geminiConfigured) {
    return createImageGenerationError(
      "Prompt image",
      prompt,
      "Генерация изображений не настроена. Добавьте NANOBANANA_EXPERT_API_KEY или GEMINI_API_KEY в .env."
    );
  }

  return createImageGenerationError("Prompt image", prompt, summarizeImageGenerationErrors(providerErrors));
}
