import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import {
  SKU_KIT_PRICE_RUB,
  formatRub
} from "@/lib/pricing";

const defaultSiteUrl = "https://marketcard-ai.avenir-team.ru";

/** Cache-busting icon version — bump when favicon assets change. */
export const FAVICON_VERSION = "v2";

export const baseKeywords = [
  "генератор карточек товара",
  "нейросеть для карточек товара",
  "ии карточка товара",
  "карточка товара",
  "генератор карточек",
  "генератор карточек бесплатно",
  "карточка товара по фото",
  "инфографика для маркетплейсов",
  "инфографика wildberries",
  "инфографика для вб",
  "нейросеть для карточек wildberries",
  "карточка товара wildberries",
  "карточка товара ozon",
  "карточка товара авито",
  "генератор описания товара",
  "сео описание маркетплейс",
  "сео для wildberries",
  "видео из карточки",
  "карусель карточек wildberries",
  "публикация на wildberries",
  "api wildberries карточки",
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
] as const;

export const siteConfig = {
  name: BRAND.marketCard,
  shortName: BRAND.marketCardShort,
  title: "ИИ-генератор карточек для маркетплейсов — МаркетКард",
  description:
    "Создайте карточку товара для Wildberries, Ozon и Авито по фото за 1–2 минуты. Обложка, инфографика и SEO-текст. 1 пробная карточка после регистрации.",
  keywords: [...baseKeywords],
  locale: "ru_RU",
  url: process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl
};

export function mergeKeywords(extra?: string[]) {
  if (!extra?.length) {
    return [...siteConfig.keywords];
  }

  return [...new Set([...extra, ...siteConfig.keywords])];
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

type SiteIconDescriptor = {
  url: string;
  type?: string;
  sizes?: string;
};

type SiteIcons = {
  icon: SiteIconDescriptor[];
  shortcut: string;
  apple: SiteIconDescriptor[];
};

export const siteIcons: SiteIcons = {
  icon: [
    { url: absoluteUrl(`/favicon-${FAVICON_VERSION}.ico`), type: "image/x-icon", sizes: "any" },
    { url: absoluteUrl(`/favicon-${FAVICON_VERSION}.svg`), type: "image/svg+xml", sizes: "any" },
    { url: absoluteUrl(`/favicon-32x32-${FAVICON_VERSION}.png`), type: "image/png", sizes: "32x32" },
    { url: absoluteUrl(`/favicon-48x48-${FAVICON_VERSION}.png`), type: "image/png", sizes: "48x48" },
    { url: absoluteUrl(`/icon-192-${FAVICON_VERSION}.png`), type: "image/png", sizes: "192x192" },
    { url: absoluteUrl(`/icon-512-${FAVICON_VERSION}.png`), type: "image/png", sizes: "512x512" }
  ],
  shortcut: absoluteUrl(`/favicon-${FAVICON_VERSION}.ico`),
  apple: [
    {
      url: absoluteUrl(`/apple-touch-icon-${FAVICON_VERSION}.png`),
      sizes: "180x180",
      type: "image/png"
    }
  ]
};

export function createPageMetadata({
  title,
  documentTitle,
  description,
  path = "/",
  keywords,
  noIndex = false
}: {
  /** Short title — becomes `${title} | ${siteConfig.name}` unless documentTitle is set. */
  title?: string;
  /** Full document title used as-is (preferred for search snippets). */
  documentTitle?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const pageTitle = documentTitle ?? (title ? `${title} | ${siteConfig.name}` : siteConfig.title);
  const pageDescription = description || siteConfig.description;
  const pageKeywords = mergeKeywords(keywords);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    applicationName: siteConfig.shortName,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        "ru-RU": absoluteUrl(path)
      }
    },
    icons: siteIcons,
    manifest: "/site.webmanifest",
    category: "business",
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      telephone: false,
      email: false,
      address: false
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
          alt: `${siteConfig.name} — генератор карточек товара для маркетплейсов`
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
    themeColor: "#6D28D9",
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

/** Kept for OG/alt texts that mention starting kit price. */
export const seoKitPriceHint = `комплект от ${formatRub(SKU_KIT_PRICE_RUB)}`;
