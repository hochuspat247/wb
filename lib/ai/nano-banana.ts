import type { ProductImageGenerationInput } from "@/types/product-card";

type GeminiInteractionResponse = {
  output_image?: {
    data?: string;
    mime_type?: string;
    mimeType?: string;
  };
  outputImage?: {
    data?: string;
    mime_type?: string;
    mimeType?: string;
  };
};

type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

export async function generateMarketplaceImage(input: ProductImageGenerationInput) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  const image = parseDataUrl(input.imageDataUrl);
  const prompt = buildNanoBananaPrompt(input);

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      model,
      input: [
        { type: "text", text: prompt },
        {
          type: "image",
          mime_type: image.mimeType,
          data: image.base64
        }
      ],
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: "1:1",
        image_size: process.env.GEMINI_IMAGE_SIZE || "1K"
      }
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini image error ${response.status}${errorText ? `: ${errorText.slice(0, 240)}` : ""}`);
  }

  const data = (await response.json()) as GeminiInteractionResponse;
  const outputImage = data.output_image ?? data.outputImage;
  const outputBase64 = outputImage?.data;

  if (!outputBase64) {
    throw new Error("Gemini did not return an image");
  }

  const outputMimeType = outputImage?.mime_type ?? outputImage?.mimeType ?? "image/jpeg";
  return {
    imageDataUrl: `data:${outputMimeType};base64,${outputBase64}`,
    provider: `Nano Banana (${model})`
  };
}

function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image data URL");
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function buildNanoBananaPrompt(input: ProductImageGenerationInput) {
  const card = input.card;

  return `Create a professional square marketplace product visual for Russian e-commerce.

Use the provided product photo as the exact main product reference. Preserve the product identity, shape, colors, materials, logos and visible details. Do not replace it with another object.

Output requirements:
- Aspect ratio 1:1.
- Looks like a first image for Wildberries/Ozon product listing, not a website mockup.
- Product occupies 60-75% of the frame and is clearly visible.
- Clean advertising composition with modern marketplace design.
- Leave clean empty areas for text overlays that will be added later by the application.
- Do not generate any text, letters, numbers, Cyrillic, Latin characters, words, captions, badges, logos, UI labels, watermarks or random symbols.
- No fake brand logos, no watermark, no random seller labels, no extra products.
- Avoid tiny unreadable text. Avoid medical/legal claims.

Marketplace: ${input.marketplace}
Category: ${card.category}
Style: ${input.style}
Product description: ${input.productDescription}

Design direction:
${card.visualConcept}

Make it visually competitive with high-converting Russian marketplace cards: bold hierarchy, clean product focus, contrast, realistic light, polished commercial finish, but keep the generated image completely text-free.`;
}
