import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { absoluteUrl, siteConfig, siteIcons } from "@/lib/seo";
import {
  STORY_GENERATION_PRICE_RUB,
  formatStoryRub
} from "@/lib/storystudio/pricing";
import { VIDEO_STANDARD_PRICE_4_SEC, formatVideoPriceRub } from "@/config/video-pricing";

export const storyStudioConfig = {
  name: BRAND.storyStudio,
  brand: `${BRAND.storyStudio} — рабочая среда для историй с ИИ`,
  title: `${BRAND.storyStudio} — напишите историю с ИИ от идеи до глав`,
  description: `${BRAND.storyStudio} хранит персонажей, мир и отношения, помогает планировать сюжет и писать главы без потери контекста. Русский язык, демо без регистрации, от ${formatStoryRub(STORY_GENERATION_PRICE_RUB)} за генерацию.`,
  keywords: [
    "стористудио",
    "story studio ии",
    "генератор историй",
    "нейросеть для книги",
    "ии писатель",
    "создать историю с ии",
    "генератор персонажей",
    "карта связей персонажей",
    "написать книгу с нейросетью",
    "создать новеллу",
    "фанфик генератор",
    "генератор фанфиков",
    "генератор романа",
    "ии для сценария",
    "видео из персонажа",
    "вео 3.1 история",
    "ии генератор глав",
    "дерево связей героев",
    "писательский ии",
    "создать роман онлайн",
    "интерактивная карта персонажей",
    "генератор портретов персонажа",
    "видео серия ии",
    "русский ии для писателей",
    "нейросеть для написания книги",
    "ии новелла",
    "создать персонажей для книги",
    "генератор сюжета",
    "ии для авторов",
    "написать фанфик с ии"
  ],
  locale: "ru_RU",
  ogImagePath: "/storystudio/opengraph-image"
};

export function storyStudioAbsoluteUrl(path = "/storystudio") {
  return absoluteUrl(path);
}

export function createStoryStudioMetadata({
  title,
  description,
  path = "/storystudio",
  noIndex = false,
  keywords
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const pageTitle = title ? `${title} | ${BRAND.storyStudio}` : storyStudioConfig.title;
  const pageDescription = description || storyStudioConfig.description;
  const pageKeywords = keywords ?? storyStudioConfig.keywords;
  const ogImage = storyStudioAbsoluteUrl(storyStudioConfig.ogImagePath);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    applicationName: storyStudioConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        "ru-RU": absoluteUrl(path)
      }
    },
    icons: {
      icon: [
        { url: storyStudioAbsoluteUrl("/storystudio/icon"), type: "image/png", sizes: "32x32" },
        ...siteIcons.icon
      ],
      shortcut: siteIcons.shortcut,
      apple: [
        { url: storyStudioAbsoluteUrl("/storystudio/apple-icon"), sizes: "180x180", type: "image/png" },
        ...siteIcons.apple
      ]
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: storyStudioConfig.locale,
      url: absoluteUrl(path),
      siteName: storyStudioConfig.name,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${storyStudioConfig.name} — ИИ генератор историй и видео-серий`
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
    category: "technology",
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

export const storyStudioLandingDescription = storyStudioConfig.description;

export const storyStudioCreateDescription =
  "Опишите идею — ИИ соберёт синопсис, персонажей, мир и план сюжета. Продолжайте главы в кабинете, не теряя контекст произведения.";

export const storyStudioVideoSnippet = `Видео-сцены из портретов — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)} за 4 сек через ${BRAND.googleVeo} ${BRAND.veoVersion}.`;
