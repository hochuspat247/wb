import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "@/lib/ai/imagePrompt";
import { formatImageProviderError, isGeminiQuotaError } from "@/lib/ai/imageGenerationErrors";
import type { GenerateImageInput, GenerateImageResult, ImageGenerationMode } from "@/types/product-card";

type GeminiImageOutput = {
  data?: string;
  mime_type?: string;
  mimeType?: string;
};

type GeminiInteractionResult = {
  output_image?: GeminiImageOutput;
  outputImage?: GeminiImageOutput;
};

export async function generateGeminiProductImage(
  input: GenerateImageInput,
  imageMode: ImageGenerationMode = "fast"
): Promise<GenerateImageResult> {
  const prompt = buildImagePrompt(input);
  const generatedAt = new Date().toISOString();

  if (imageMode === "html") {
    return createFallbackResult(prompt, "HTML-preview выбран в настройках изображения.", generatedAt);
  }

  if (!process.env.GEMINI_API_KEY) {
    return createFallbackResult(prompt, "GEMINI_API_KEY не задан.", generatedAt);
  }

  if (!input.imageBase64 || !input.imageMimeType) {
    return createFallbackResult(prompt, "Для ИИ-изображения нужно загруженное фото товара.", generatedAt);
  }

  const models = getModelQueue(imageMode);
  const errors: string[] = [];

  for (const model of models) {
    try {
      const result = await callGeminiImageModel(input, prompt, model);

      if (result.imageBase64) {
        return {
          ...result,
          imageUrl: null,
          generatedAt,
          prompt,
          provider: "Gemini Nano Banana",
          model,
          isFallback: false
        };
      }

      errors.push(`${model}: empty image response`);
    } catch (error) {
      errors.push(`${model}: ${formatError(error)}`);
    }
  }

  return createFallbackResult(prompt, summarizeGeminiErrors(errors), generatedAt);
}

export async function generateGeminiPromptImage(
  prompt: string,
  options: { aspectRatio?: string; imageMode?: ImageGenerationMode } = {}
): Promise<GenerateImageResult> {
  const generatedAt = new Date().toISOString();
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    return createFallbackResult(trimmedPrompt, "Пустой промпт для изображения.", generatedAt);
  }

  if (!process.env.GEMINI_API_KEY) {
    return createFallbackResult(trimmedPrompt, "GEMINI_API_KEY не задан.", generatedAt);
  }

  const models = getModelQueue(options.imageMode);
  const aspectRatio = options.aspectRatio || "3:4";
  const errors: string[] = [];

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model,
        contents: trimmedPrompt,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const data = part.inlineData?.data;
        if (data) {
          return {
            imageBase64: data,
            imageUrl: null,
            mimeType: part.inlineData?.mimeType ?? "image/png",
            provider: "Gemini Nano Banana",
            model,
            prompt: trimmedPrompt,
            generatedAt,
            isFallback: false
          };
        }
      }

      errors.push(`${model}: empty image response`);
    } catch (error) {
      const message = formatError(error);
      errors.push(`${model}: ${message}`);
      if (isGeminiQuotaError(message)) {
        break;
      }
    }
  }

  return createFallbackResult(trimmedPrompt, summarizeGeminiErrors(errors), generatedAt);
}

function summarizeGeminiErrors(errors: string[]) {
  const formatted = errors.map((error) => formatImageProviderError(error));
  const unique = formatted.filter((error, index) => formatted.indexOf(error) === index);

  if (!unique.length) {
    return "Gemini не вернул изображение.";
  }

  if (unique.every((error) => isGeminiQuotaError(error) || error.includes("квота Gemini"))) {
    return unique[0];
  }

  return unique.join(" ");
}

async function callGeminiImageModel(input: GenerateImageInput, prompt: string, model: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const interaction = (await ai.interactions.create({
    model,
    input: [
      {
        type: "text",
        text: prompt
      },
      {
        type: "image",
        data: input.imageBase64 as string,
        mime_type: input.imageMimeType as string
      }
    ],
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: "4:5",
      image_size: "1K"
    }
  } as never)) as GeminiInteractionResult;

  const outputImage = interaction.output_image ?? interaction.outputImage;

  return {
    imageBase64: outputImage?.data ?? null,
    mimeType: outputImage?.mime_type ?? outputImage?.mimeType ?? "image/jpeg"
  };
}

function getModelQueue(mode: ImageGenerationMode = "fast") {
  const fastModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  const legacyModel = process.env.GEMINI_IMAGE_FALLBACK_MODEL || "gemini-2.5-flash-image";
  const proModel = process.env.GEMINI_IMAGE_PRO_MODEL || "gemini-3-pro-image";
  const selectedModel =
    mode === "legacy" ? legacyModel :
    mode === "pro" ? proModel :
    fastModel;

  return Array.from(new Set([selectedModel, legacyModel]));
}

function createFallbackResult(prompt: string, error: string, generatedAt: string): GenerateImageResult {
  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider: "HTML/CSS fallback",
    model: "fallback",
    prompt,
    generatedAt,
    isFallback: true,
    error
  };
}

function formatError(error: unknown) {
  return formatImageProviderError(error);
}

