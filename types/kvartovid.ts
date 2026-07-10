export type KvartovidDealType = "sale" | "rent" | "daily";

export type KvartovidPropertyType = "apartment" | "room" | "house" | "studio";

export type KvartovidPhotoInput = {
  base64: string;
  mimeType: string;
  name?: string;
};

export type KvartovidPlatformId = "avito" | "cian" | "domclick";

export type KvartovidPlatformText = {
  platform: KvartovidPlatformId;
  label: string;
  title: string;
  description: string;
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
  includeFloorPlan?: boolean;
};

export type KvartovidFloorPlanRoom = {
  name: string;
  area?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type KvartovidFloorPlanLayout = {
  width: number;
  height: number;
  rooms: KvartovidFloorPlanRoom[];
  totalArea: number;
  propertyLabel: string;
};

export type KvartovidListingResult = {
  title: string;
  description: string;
  platformTexts: KvartovidPlatformText[];
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
  floorPlanSvg?: string;
  floorPlanLayout?: KvartovidFloorPlanLayout;
  floorPlanError?: string;
  generatedAt: string;
  listingId?: string;
};

export type KvartovidSavedListing = {
  id: string;
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
  photoCount: number;
  title: string;
  description: string;
  platformTexts: KvartovidPlatformText[];
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
  floorPlanSvg?: string;
  floorPlanLayout?: KvartovidFloorPlanLayout;
  floorPlanError?: string;
  createdAt: string;
  updatedAt: string;
};

export type KvartovidVideoInput = {
  title: string;
  description: string;
  advantages?: string[];
  city?: string;
  rooms?: string;
  area?: number;
  propertyType?: KvartovidPropertyType;
  renovation?: string;
  extraFeatures?: string;
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
