import { generateGeminiProductImage } from "@/lib/ai/geminiImage";
import { generateNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import type { GenerateImageInput, GenerateImageResult, ImageGenerationMode, ImageProviderMode } from "@/types/product-card";

export function resolveImageProvider(
  fromRequest?: ImageProviderMode,
  envKeys: Array<"IMAGE_PROVIDER" | "DEMO_IMAGE_PROVIDER"> = ["IMAGE_PROVIDER"]
): ImageProviderMode {
  const fromEnv = envKeys
    .map((key) => process.env[key])
    .find(Boolean)
    ?.toLowerCase() as ImageProviderMode | undefined;

  if (fromRequest && fromRequest !== "auto") {
    return fromRequest;
  }

  if (fromEnv && fromEnv !== "auto") {
    return fromEnv;
  }

  return "auto";
}

export async function generateProductImageWithProvider(
  input: GenerateImageInput,
  options: { provider?: ImageProviderMode; imageMode?: ImageGenerationMode } = {}
): Promise<GenerateImageResult> {
  const provider = resolveImageProvider(options.provider, ["DEMO_IMAGE_PROVIDER", "IMAGE_PROVIDER"]);
  const imageMode = options.imageMode ?? "fast";

  if (provider === "nanobanana_expert") {
    return generateNanoBananaExpertImage(input);
  }

  if (provider === "gemini") {
    return generateGeminiProductImage(input, imageMode);
  }

  let lastError: GenerateImageResult | null = null;

  if (isNanoBananaExpertConfigured()) {
    const nanoResult = await generateNanoBananaExpertImage(input);
    if (!nanoResult.isFallback) {
      return nanoResult;
    }
    lastError = nanoResult;
  }

  if (process.env.GEMINI_API_KEY) {
    const geminiResult = await generateGeminiProductImage(input, imageMode);
    if (!geminiResult.isFallback) {
      return geminiResult;
    }
    lastError = geminiResult;
  }

  return (
    lastError ?? {
      imageBase64: null,
      imageUrl: null,
      mimeType: null,
      provider: "auto",
      model: "error",
      prompt: input.productDescription,
      generatedAt: new Date().toISOString(),
      isFallback: true,
      error: "ИИ-провайдеры недоступны или вернули ошибку."
    }
  );
}
