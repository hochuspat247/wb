import type { MarketplacePlatform, MarketplaceTextMode, MarketplaceTextResult } from "@/types/marketplace";

export type ProductCardInput = {
  productDescription: string;
  category?: string;
  marketplace: string;
  style: string;
  includeSeo: boolean;
  focusBenefits: boolean;
  includeInfographicText: boolean;
  imageFileName?: string;
  platform?: MarketplacePlatform;
  textMode?: MarketplaceTextMode;
  brand?: string;
  sellerSku?: string;
  color?: string;
  size?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  packageContents?: string;
  targetAudience?: string;
  useCase?: string;
  oldPrice?: string;
  discount?: string;
  price?: string;
};

export type ProductCardSourceInput = ProductCardInput & {
  headline?: string;
  price?: string;
  ctaText?: string;
  designPreset?: ImageDesignPreset;
  imageMode?: ImageGenerationMode;
  removeBackground?: boolean;
};

export type ProductCharacteristic = {
  key: string;
  value: string;
};

export type ProductCardResult = {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  characteristics: ProductCharacteristic[];
  keywords: string[];
  infographicTexts: string[];
  marketplaceTips: string[];
  visualConcept: string;
  category: string;
  marketplace: string;
  style: string;
  generatedAt: string;
  provider: string;
  isFallback: boolean;
  imageDataUrl?: string;
  generatedImageDataUrl?: string;
  generatedImageUrl?: string | null;
  generatedImageProvider?: string;
  generatedImageBase64?: string | null;
  generatedImageMimeType?: string | null;
  generatedImageModel?: string;
  generatedImagePrompt?: string;
  generatedImageIsFallback?: boolean;
  generatedImageError?: string;
  bananasSpent?: number;
  usedCoupon?: boolean;
  generationId?: string;
  seed?: number;
  price?: string;
  ctaText?: string;
  headline?: string;
  designPreset?: ImageDesignPreset;
  platform?: MarketplacePlatform;
  textMode?: MarketplaceTextMode;
  marketplaceText?: MarketplaceTextResult;
  sourceInput?: ProductCardSourceInput;
};

export type AiProviderName = "Gemini" | "Ollama" | "OpenRouter" | "Hugging Face" | "Smart fallback";

export type ProductImageGenerationInput = {
  card: ProductCardResult;
  productDescription: string;
  imageDataUrl: string;
  style: string;
  marketplace: string;
  imageProvider?: ImageProviderMode;
  imageMode?: ImageGenerationMode;
};

export type ImageProviderMode = "html" | "nanobanana_expert" | "gemini" | "auto";

export type ImageGenerationMode = "html" | "fast" | "legacy" | "pro";

export type NanoBananaExpertModel = "nb2" | "gpt2";

export type NanoBananaExpertResolution = "1k" | "2k" | "4k";

export type NanoBananaExpertOutputFormat = "png" | "jpeg" | "webp";

export type NanoBananaExpertAspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

export type ImageDesignPreset = "standard" | "premium-marketplace" | "luxury-catalog";

export type GenerateImageInput = {
  productDescription: string;
  category: string;
  marketplace: string;
  style: string;
  title: string;
  benefits: string[];
  infographicTexts: string[];
  characteristics?: { key: string; value: string }[];
  keywords?: string[];
  imageBase64?: string;
  imageMimeType?: string;
  price?: string;
  ctaText?: string;
  headline?: string;
  designPreset?: ImageDesignPreset;
  model?: "nb2" | "gpt2";
  aspectRatio?: string;
  resolution?: "1k" | "2k" | "4k";
  outputFormat?: "png" | "jpeg" | "webp";
};

export type GenerateImageResult = {
  imageBase64: string | null;
  imageUrl?: string | null;
  mimeType: string | null;
  provider: string;
  model: string;
  prompt: string;
  generatedAt: string;
  isFallback: boolean;
  error?: string;
  bananasSpent?: number;
  usedCoupon?: boolean;
  generationId?: string;
  seed?: number;
};
