import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { absoluteUrl, siteConfig } from "@/lib/seo";
import { KVARTOVID_POSITIONING } from "@/lib/kvartovid/constants";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";

export const kvartovidConfig = {
  name: BRAND.kvartovid,
  brand: `${BRAND.kvartovid} — ИИ для объявлений о недвижимости`,
  title: `${BRAND.kvartovid} — объявление о квартире, обложка, планировка и тексты для Авито и Циан`,
  description: `${KVARTOVID_POSITIONING} Загрузите 3–10 фото и параметры объекта — нейросеть подготовит заголовок, описание для Авито, Циан и Домклик, AI-обложку, схему планировки и видео. Для продажи, аренды и посуточной сдачи. От ${formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект, 1 бесплатно.`,
  keywords: [
    "квартовид",
    "кварто вид",
    "ии для недвижимости",
    "нейросеть для риэлтора",
    "генератор объявления недвижимость",
    "описание квартиры для продажи",
    "описание квартиры для аренды",
    "как написать объявление о продаже квартиры",
    "как написать объявление о сдаче квартиры",
    "текст объявления недвижимость",
    "объявление о продаже квартиры",
    "объявление аренда квартиры",
    "объявление авито недвижимость",
    "текст для авито квартира",
    "объявление циан квартира",
    "текст для циан недвижимость",
    "объявление домклик",
    "фото квартиры для продажи",
    "ии описание квартиры",
    "обложка для авито квартира",
    "ai обложка недвижимость",
    "планировка квартиры для объявления",
    "схема квартиры для авито",
    "чертеж планировки квартиры",
    "как продать квартиру быстрее",
    "как сдать квартиру быстрее",
    "упаковка объявления квартира",
    "ии для агентства недвижимости",
    "генератор текста для риэлтора",
    "видео из фото квартиры",
    "объявление посуточно квартира",
    "продающее описание квартиры",
    "заголовок объявления квартира",
    "шаблон объявления аренда квартиры",
    "как оформить объявление на авито недвижимость",
    "текст объявления продажа квартиры пример",
    "ии помощник риэлтора",
    "сервис для риэлторов недвижимость"
  ],
  locale: "ru_RU",
  ogImagePath: "/kvartovid/opengraph-image"
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
  const pageKeywords = keywords ? [...new Set([...keywords, ...kvartovidConfig.keywords])] : kvartovidConfig.keywords;
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
    category: "real estate",
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

export const kvartovidCreateDescription =
  "Загрузите 3–10 фото квартиры и параметры объекта — ИИ сгенерирует заголовок, тексты для Авито, Циан и Домклик, преимущества, AI-обложку и схему планировки для скачивания.";

export const kvartovidLandingDescription = kvartovidConfig.description;
