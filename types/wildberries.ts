import type { ProductCardResult } from "@/types/product-card";

export type WildberriesIntegrationStatus = {
  connected: boolean;
  isSandbox: boolean;
  lastCheckedAt?: string | null;
  lastError?: string | null;
  updatedAt?: string | null;
  unlocked?: boolean;
};

export type WildberriesSubject = {
  subjectID: number;
  subjectName: string;
  parentID?: number;
  parentName?: string;
};

export type WildberriesSlideInput = {
  cardId?: string;
  imageBase64?: string;
  imageMimeType?: string;
  label?: string;
};

export type WildberriesPublishInput = {
  card: ProductCardResult;
  subjectId: number;
  slides?: WildberriesSlideInput[];
  techSize?: string;
  wbSize?: string;
  barcode?: string;
  vendorCode?: string;
  brand?: string;
  price?: string;
  dimensions?: string;
  weight?: string;
};

export type WildberriesPublishResult = {
  ok: boolean;
  vendorCode: string;
  barcode: string;
  subjectId: number;
  nmId?: number | null;
  mediaUploaded: number;
  payload: unknown;
  response: unknown;
};

export type WildberriesCatalogCharacteristic = {
  id: number;
  name: string;
  value: string | string[];
};

export type WildberriesCatalogSize = {
  chrtId?: number;
  techSize: string;
  wbSize?: string;
  skus: string[];
};

export type WildberriesCatalogCard = {
  nmId: number;
  imtId?: number;
  vendorCode: string;
  title: string;
  description: string;
  brand: string;
  subjectId: number;
  subjectName: string;
  photoUrl: string | null;
  photoCount: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weightBrutto: number;
  };
  characteristics: WildberriesCatalogCharacteristic[];
  sizes: WildberriesCatalogSize[];
  updatedAt: string;
  createdAt: string;
  inTrash?: boolean;
  kizMarked?: boolean;
  needKiz?: boolean;
};

export type WildberriesCardsListQuery = {
  search?: string;
  limit?: number;
  updatedAt?: string;
  nmId?: number;
  source?: "active" | "trash";
};

export type WildberriesCardsListResult = {
  cards: WildberriesCatalogCard[];
  cursor: {
    updatedAt?: string;
    nmId?: number;
    total?: number;
    trashedAt?: string;
  };
  hasMore: boolean;
};

export type WildberriesUpdateInput = {
  nmId: number;
  vendorCode: string;
  title: string;
  description: string;
  brand: string;
  kizMarked?: boolean;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weightBrutto: number;
  };
  characteristics: Array<{ id: number; value: string | string[] }>;
  sizes: WildberriesCatalogSize[];
};

export type WildberriesUpdateResult = {
  ok: boolean;
  nmId: number;
  vendorCode: string;
  response: unknown;
};
