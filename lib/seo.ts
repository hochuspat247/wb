import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  VIDEO_GENERATION_START_PRICE_RUB,
  formatRub,
  formatVideoPriceRub
} from "@/lib/pricing";

const defaultSiteUrl = "https://marketcard-ai.avenir-team.ru";

export const siteConfig = {
  name: BRAND.marketCard,
  title: `${BRAND.marketCard} — карточки и видео товаров для ВБ, Озон и Авито`,
  description: `Загрузите фото товара — получите карточку с текстом, СЕО и ИИ-обложкой 4:5 для Вайлдберриз, Озон, Авито и Яндекс Маркета. ${FREE_TOTAL_MARKETING_CARDS} карточки бесплатно (1 демо + 2 после входа), далее ${formatRub(CARD_GENERATION_PRICE_RUB)} за фото. Видео из карточки — от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}.`,
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
    "сео описание",
    "маркетплейс",
    "вео 3.1",
    "гугл вео",
    "маркеткард ии",
    "обложка 4:5",
    "ии карточка товара"
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
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" }
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
    },
    manifest: "/site.webmanifest",
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
