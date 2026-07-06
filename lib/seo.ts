import type { Metadata } from "next";

const defaultSiteUrl = "https://marketcard-ai.avenir-team.ru";

export const siteConfig = {
  name: "MarketCard AI",
  title: "MarketCard AI — карточки товаров для WB, Ozon и Avito за 2 минуты",
  description:
    "Загрузите фото товара и получите продающую карточку с текстом, SEO, инфографикой и AI-обложкой для Wildberries, Ozon, Avito и Яндекс Маркета.",
  keywords: [
    "карточка товара",
    "wildberries",
    "ozon",
    "avito",
    "яндекс маркет",
    "генератор карточек",
    "инфографика",
    "seo описание",
    "маркетплейс",
    "marketcard ai"
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
