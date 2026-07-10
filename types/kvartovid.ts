export type KvartovidDealType = "sale" | "rent" | "daily";

export type KvartovidPropertyType = "apartment" | "room" | "house" | "studio";

export type KvartovidPhotoInput = {
  base64: string;
  mimeType: string;
  name?: string;
};

export type KvartovidListingInput = {
  dealType: KvartovidDealType;
  propertyType: KvartovidPropertyType;
  rooms: string;
  area: number;
  floor?: number;
  totalFloors?: number;
  price?: string;
  city: string;
  district?: string;
  metro?: string;
  address?: string;
  renovation?: string;
  extraFeatures?: string;
  photos: KvartovidPhotoInput[];
  selectedHighlights?: string[];
  includeCover?: boolean;
};

export type KvartovidListingResult = {
  title: string;
  description: string;
  advantages: string[];
  suggestedHighlights: string[];
  bestPhotoIndex: number;
  coverImageBase64?: string;
  coverImageMimeType?: string;
  coverImageUrl?: string | null;
  coverImageProvider?: string;
  coverImageModel?: string;
  coverImageError?: string;
  qualityScore?: number;
  qualityTips?: string[];
  generatedAt: string;
};

export type KvartovidVideoInput = {
  title: string;
  description: string;
  advantages?: string[];
  city?: string;
  imageBase64?: string;
  imageMimeType?: string;
  duration?: "4" | "6" | "8";
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  quality?: "standard" | "pro";
  motionStyle?: "soft_zoom" | "premium_parallax" | "light_sweep" | "marketplace_motion";
  generateAudio?: boolean;
  useVideoCredit?: boolean;
  customerEmail?: string;
};

export type CreateKvartovidVideoInput = KvartovidVideoInput & {
  duration: "4" | "6" | "8";
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  imageBase64: string;
  imageMimeType: string;
};
