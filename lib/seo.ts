import type { Metadata } from "next";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TRIAL_CARDS,
  VIDEO_GENERATION_START_PRICE_RUB,
  formatRub,
  formatVideoPriceRub
} from "@/lib/pricing";

const defaultSiteUrl = "https://marketcard-ai.avenir-team.ru";

export const siteConfig = {
  name: "MarketCard AI",
  title: "MarketCard AI — карточки и видео товаров для WB, Ozon и Avito",
  description: `Загрузите фото товара — получите карточку с текстом, SEO и AI-обложкой 4:5 для Wildberries, Ozon, Avito и Яндекс Маркета. ${FREE_TRIAL_CARDS} карточки бесплатно, далее ${formatRub(CARD_GENERATION_PRICE_RUB)} за фото. Видео из карточки — от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}.`,
  keywords: [
    "карточка товара",
    "видео из карточки",
    "видео товара",
    "wildberries",
    "ozon",
    "avito",
    "яндекс маркет",
    "генератор карточек",
    "инфографика",
    "seo описание",
    "маркетплейс",
    "veo 3.1",
    "google veo",
    "marketcard ai",
    "обложка 4:5",
    "ai карточка товара"
  ],
  locale: "ru_RU",
  url: process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const pageDescription = description || siteConfig.description;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: siteConfig.keywords,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: absoluteUrl(path)
    },
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png" }],
      shortcut: "/favicon.png",
      apple: "/favicon.png"
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [absoluteUrl("/opengraph-image")]
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" }
        }
  };
}

export const rootMetadata: Metadata = createPageMetadata({ path: "/" });
