import { InferenceClient, type InferenceProviderOrPolicy } from "@huggingface/inference";
import type { ProductImageGenerationInput } from "@/types/product-card";

export async function generateHuggingFaceMarketplaceImage(input: ProductImageGenerationInput) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }

  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "Qwen/Qwen-Image-Edit";
  const providers = getProviderQueue();
  const image = parseDataUrl(input.imageDataUrl);
  const prompt = buildHuggingFaceImagePrompt(input);
  const client = new InferenceClient(apiKey);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const result = await client.imageToImage({
        model,
        provider,
        inputs: new Blob([image.bytes], { type: image.mimeType }),
        parameters: {
          prompt,
          width: 1024,
          height: 1024,
          guidance_scale: 4.5,
          num_inference_steps: 28
        }
      });
      const buffer = Buffer.from(await result.arrayBuffer());
      const mimeType = result.type || "image/png";

      return {
        imageDataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
        provider: `Hugging Face ${provider} (${model})`
      };
    } catch (error) {
      const message = `${provider}: ${formatFetchError(error)}`;
      errors.push(message);
      console.warn("[MarketCard AI] HF image provider failed:", message);
    }
  }

  throw new Error(`Hugging Face image request failed for all providers. Model: ${model}. Tried: ${errors.join(" | ")}`);
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image data URL");
  }

  return {
    mimeType: match[1],
    base64: match[2],
    bytes: Buffer.from(match[2], "base64")
  };
}

function getProviderQueue(): InferenceProviderOrPolicy[] {
  const rawProviders =
    process.env.HUGGINGFACE_IMAGE_PROVIDERS ||
    process.env.HUGGINGFACE_IMAGE_PROVIDER ||
    "auto,replicate,fal-ai";

  return rawProviders
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean) as InferenceProviderOrPolicy[];
}

function formatFetchError(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown network error";
  }

  const cause = error.cause;

  if (cause && typeof cause === "object" && "code" in cause) {
    return `${error.message} (${String((cause as { code?: unknown }).code)})`;
  }

  return error.message;
}

function buildHuggingFaceImagePrompt(input: ProductImageGenerationInput) {
  const card = input.card;
  return `Edit the provided product photo into a premium square marketplace product visual for Russian e-commerce.

Preserve the exact product from the input image: same object, shape, material, colors and visible details. Do not replace it with another product.

Create a polished 1:1 product listing background/composition for ${input.marketplace}. The product should be large, clean and central, occupying 60-75% of the frame. Add a high-converting commercial background in "${input.style}" style with empty clean areas where text overlays can be placed later.

Critical typography rule: do not generate any text, letters, numbers, Cyrillic, Latin characters, words, captions, badges, logos, UI labels, watermarks or random symbols. The application will add all Russian text separately after image generation.

Category: ${card.category}
Product description: ${input.productDescription}

Avoid watermarks, fake marketplace UI, QR codes, tiny unreadable text, extra products, fake brand logos and medical/legal claims. Make it look like a high-converting Wildberries/Ozon first image, but keep the image completely text-free.`;
}
