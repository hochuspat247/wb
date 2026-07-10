import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { absoluteUrl, siteConfig } from "@/lib/seo";
import { KVARTOVID_POSITIONING } from "@/lib/kvartovid/constants";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";

export const kvartovidConfig = {
  name: BRAND.kvartovid,
  brand: `${BRAND.kvartovid} — ИИ для объявлений о недвижимости`,
  title: `${BRAND.kvartovid} — объявление о квартире, обложка и описание за 1 минуту`,
  description: `${KVARTOVID_POSITIONING} Загрузите фото и параметры — ИИ подготовит заголовок, описание, преимущества и продающую обложку для Авито, Циан и соцсетей. От ${formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект.`,
  keywords: [
    "квартовид",
    "описание квартиры для продажи",
    "описание квартиры для аренды",
    "как написать объявление о продаже квартиры",
    "как написать объявление о сдаче квартиры",
    "текст объявления недвижимость",
    "объявление о продаже квартиры",
    "объявление аренда квартиры",
    "объявление авито недвижимость",
    "фото квартиры для продажи",
    "ии описание квартиры",
    "генератор объявления недвижимость",
    "обложка для авито квартира",
    "как продать квартиру быстрее",
    "как сдать квартиру быстрее",
    "нейросеть для риэлтора",
    "текст для циан",
    "упаковка объявления квартира"
  ],
  locale: "ru_RU",
  ogImagePath: "/og-image.png"
};

export function kvartovidAbsoluteUrl(path = "/kvartovid") {
  return absoluteUrl(path);
}

export function createKvartovidMetadata({
  title,
  description,
  path = "/kvartovid",
  noIndex = false,
  keywords
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const pageTitle = title ? `${title} | ${BRAND.kvartovid}` : kvartovidConfig.title;
  const pageDescription = description || kvartovidConfig.description;
  const pageKeywords = keywords ?? kvartovidConfig.keywords;
  const ogImage = kvartovidAbsoluteUrl(kvartovidConfig.ogImagePath);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    applicationName: kvartovidConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        "ru-RU": absoluteUrl(path)
      }
    },
    openGraph: {
      type: "website",
      locale: kvartovidConfig.locale,
      url: absoluteUrl(path),
      siteName: kvartovidConfig.name,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${kvartovidConfig.name} — ИИ-упаковка объявлений о недвижимости`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImage]
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        },
    category: "technology"
  };
}

export const kvartovidCreateDescription =
  "Загрузите 3–10 фото квартиры и укажите параметры — ИИ сгенерирует заголовок, описание, преимущества и обложку объявления.";
