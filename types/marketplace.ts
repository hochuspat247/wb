import type { PreviousCardSnapshot } from "@/types/product-card";

export type MarketplacePlatform =
  | "wildberries"
  | "ozon"
  | "avito"
  | "yandex_market";

export type MarketplaceTextMode =
  | "marketplace_safe"
  | "promo_creative"
  | "seo"
  | "full_listing";

export type MarketplaceTextInput = {
  platform: MarketplacePlatform;
  mode: MarketplaceTextMode;
  productDescription: string;
  category: string;
  sellerWishes?: string;
  identifiedProductName?: string;
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
  price?: string;
  oldPrice?: string;
  discount?: string;
  advantages?: string[];
  characteristics?: { key: string; value: string }[];
  keywords?: string[];
  editInstructions?: string;
  previousCard?: PreviousCardSnapshot;
};

export type WildberriesTextData = {
  wbName: string;
  wbDescription: string;
  wbCharacteristics: { key: string; value: string }[];
  wbPhotoRules: string[];
  wbSafeImageTexts: string[];
  wbForbiddenImageTexts: string[];
  wbQualityTips: string[];
};

export type OzonTextData = {
  ozonName: string;
  ozonAnnotation: string;
  ozonDescription: string;
  ozonRichContentBlocks: {
    title: string;
    text: string;
  }[];
  ozonCharacteristics: { key: string; value: string }[];
  ozonMediaTips: string[];
};

export type AvitoTextData = {
  avitoTitle: string;
  avitoDescription: string;
  avitoPriceBlock: string;
  avitoBenefits: string[];
  avitoCallToAction: string;
  avitoDeliveryText: string;
  avitoQuestionsAnswers: {
    question: string;
    answer: string;
  }[];
};

export type YandexMarketTextData = {
  yandexName: string;
  yandexDescription: string;
  yandexCharacteristics: { key: string; value: string }[];
  yandexImageRules: string[];
  yandexSafeImageTexts: string[];
  yandexForbiddenImageTexts: string[];
  yandexQualityTips: string[];
};

export type MarketplaceTextResult = {
  platform: MarketplacePlatform;
  mode: MarketplaceTextMode;

  title: string;
  shortTitle: string;
  seoTitle: string;

  shortDescription: string;
  fullDescription: string;

  advantages: string[];
  characteristics: { key: string; value: string }[];
  keywords: string[];

  imageTexts: string[];
  infographicTexts: string[];

  platformFields: {
    category: string;
    brand?: string;
    sellerSku?: string;
    color?: string;
    size?: string;
    material?: string;
    dimensions?: string;
    weight?: string;
    packageContents?: string;
  };

  platformSpecific: {
    wildberries?: WildberriesTextData | null;
    ozon?: OzonTextData | null;
    avito?: AvitoTextData | null;
    yandexMarket?: YandexMarketTextData | null;
  };

  moderationWarnings: string[];
  improvementTips: string[];
  exportChecklist: string[];
};
