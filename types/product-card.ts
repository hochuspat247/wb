import type { MarketplacePlatform, MarketplaceTextMode, MarketplaceTextResult } from "@/types/marketplace";
import type { VideoDuration, VideoMotionStyle, VideoQuality } from "@/types/video-generation";

export type GeneratedVideoSnapshot = {
  orderId: string;
  url: string;
  provider?: string;
  model?: string;
  duration?: VideoDuration;
  quality?: VideoQuality;
  motionStyle?: VideoMotionStyle;
  generateAudio?: boolean;
  createdAt: string;
};

export type PreviousCardSnapshot = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  characteristics: { key: string; value: string }[];
  infographicTexts: string[];
  visualConcept: string;
};

export type CardSeriesCount = 1 | 3 | 5 | 7 | 10;

export type CardSeriesPlanItem = {
  index: number;
  type: string;
  title: string;
  goal: string;
  mainHeadline: string;
  subheadline: string;
  bullets: string[];
  badges: string[];
  visualIdea: string;
  textDensity: "low" | "medium" | "high";
};

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
  editInstructions?: string;
  previousCard?: PreviousCardSnapshot;
};

export type ProductCardSourceInput = ProductCardInput & {
  headline?: string;
  price?: string;
  ctaText?: string;
  designPreset?: ImageDesignPreset;
  imageMode?: ImageGenerationMode;
  removeBackground?: boolean;
  cardsCount?: CardSeriesCount;
  seriesIndex?: number;
  seriesType?: string;
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
  generatedVideoUrl?: string | null;
  generatedVideoTaskId?: string;
  generatedVideoProvider?: string;
  generatedVideoModel?: string;
  generatedVideoPrompt?: string;
  generatedVideoStatus?: string;
  generatedVideoStatusMessage?: string;
  generatedVideoDurationSeconds?: number;
  generatedVideoPriceRub?: number;
  generatedVideoIsFree?: boolean;
  generatedVideos?: GeneratedVideoSnapshot[];
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
  seriesId?: string;
  seriesIndex?: number;
  seriesCount?: CardSeriesCount;
  seriesPlanItem?: CardSeriesPlanItem;
  seriesStyleGuide?: string;
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
  seriesStyleGuide?: string;
  seriesCardType?: string;
  seriesCardGoal?: string;
  seriesCardVisualIdea?: string;
  badges?: string[];
  editInstructions?: string;
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

export type GenerateVideoInput = {
  productDescription?: string;
  title?: string;
  style?: string;
  marketplace?: string;
  prompt?: string;
  negativePrompt?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageUrl?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: string;
  mode?: string;
};

export type GenerateVideoResult = {
  taskId: string;
  status: string;
  statusMessage?: string;
  videoUrl: string | null;
  durationSeconds: number;
  provider: string;
  model: string;
  prompt: string;
  generatedAt: string;
  priceRub: number;
  isFree?: boolean;
};
