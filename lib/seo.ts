import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  formatRub
} from "@/lib/pricing";

const defaultSiteUrl = "https://marketcard-ai.avenir-team.ru";

export const siteConfig = {
  name: BRAND.marketCard,
  title: `${BRAND.marketCard} — генератор карточек товара для ВБ, Озон и Авито`,
  description: `Нейросеть для карточек товара: загрузите фото — получите ИИ-обложку 4:5, название, описание, СЕО и инфографику для Вайлдберриз, Ozon, Авито и Яндекс Маркета. ${FREE_TOTAL_MARKETING_CARDS} карточки бесплатно, далее ${formatRub(CARD_GENERATION_PRICE_RUB)} за фото.`,
  keywords: [
    "генератор карточек товара",
    "нейросеть для карточек товара",
    "ии карточка товара",
    "карточка товара",
    "генератор карточек",
    "инфографика wildberries",
    "инфографика для вб",
    "карточка товара wildberries",
    "карточка товара ozon",
    "карточка товара авито",
    "генератор описания товара",
    "сео описание маркетплейс",
    "видео из карточки",
    "wildberries",
    "ozon",
    "avito",
    "вайлдберриз",
    "озон",
    "яндекс маркет",
    "маркетплейс",
    "селлер",
    "обложка 4:5",
    "маркеткард ии"
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
      canonical: absoluteUrl(path),
      languages: {
        "ru-RU": absoluteUrl(path)
      }
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon-192x192.png", type: "image/png", sizes: "120x120" }
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
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
        },
    ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          verification: {
            ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
              ? { yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION }
              : {}),
            ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
              ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
              : {})
          }
        }
      : {})
  };
}

export const rootMetadata: Metadata = createPageMetadata({ path: "/" });
