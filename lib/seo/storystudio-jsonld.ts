import { BRAND } from "@/lib/branding";
import { LEGAL_OPERATOR } from "@/lib/legal/operator";
import { absoluteUrl } from "@/lib/seo";
import { storyStudioConfig } from "@/lib/seo/storystudio";
import { getStoryStudioFaqItems } from "@/lib/storystudio/marketingFaq";
import { STORYSTUDIO_VIDEO_DEMO } from "@/lib/storystudio/videoExample";
import {
  STORY_GENERATION_EXPLAINER,
  STORY_GENERATION_PRICE_RUB,
  STORY_PACKAGES,
  STORY_PREMIUM_SHORT,
  calculateStoryPackagePrice,
  formatStoryRub
} from "@/lib/storystudio/pricing";
import { VIDEO_STANDARD_PRICE_4_SEC } from "@/config/video-pricing";

const publisherOrg = {
  "@type": "Organization" as const,
  name: LEGAL_OPERATOR.name,
  url: "https://avenir-team.ru/",
  email: LEGAL_OPERATOR.email
};

function buildStoryOfferCatalog() {
  return {
    "@type": "OfferCatalog",
    name: `Тарифы ${BRAND.storyStudio}`,
    itemListElement: [
      {
        "@type": "Offer",
        name: "Пробные генерации",
        price: "0",
        priceCurrency: "RUB",
        description: "2 текстовые генерации и 1 портрет после регистрации",
        url: absoluteUrl("/storystudio/create"),
        itemOffered: {
          "@type": "Service",
          name: "ИИ-основа истории",
          description: "Синопсис, персонажи и план сюжета"
        }
      },
      {
        "@type": "Offer",
        name: "1 кредит",
        price: String(STORY_GENERATION_PRICE_RUB),
        priceCurrency: "RUB",
        description: STORY_GENERATION_EXPLAINER,
        url: absoluteUrl("/storystudio#pricing"),
        itemOffered: {
          "@type": "Service",
          name: `Кредит генерации ${BRAND.storyStudio}`
        }
      },
      ...STORY_PACKAGES.map((pack) => {
        const price = calculateStoryPackagePrice(pack.count);
        return {
          "@type": "Offer",
          name: `Пакет ${pack.count} кредитов`,
          price: String(price.total),
          priceCurrency: "RUB",
          description: `${formatStoryRub(price.pricePerUnit)} за кредит · ${STORY_GENERATION_EXPLAINER}`,
          url: absoluteUrl("/storystudio#pricing"),
          itemOffered: {
            "@type": "Service",
            name: pack.label
          }
        };
      })
    ]
  };
}

function buildStorySoftwareApplication(url: string) {
  const pack100 = calculateStoryPackagePrice(100);

  return {
    "@type": "SoftwareApplication",
    name: storyStudioConfig.name,
    applicationCategory: "CreativeApplication",
    applicationSubCategory: "WritingApplication",
    operatingSystem: "Web",
    description: storyStudioConfig.description,
    url,
    inLanguage: ["ru-RU", "en"],
    publisher: publisherOrg,
    provider: publisherOrg,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: String(pack100.total),
      priceCurrency: "RUB",
      offerCount: String(2 + STORY_PACKAGES.length),
      description: `От ${formatStoryRub(STORY_GENERATION_PRICE_RUB)} за кредит, пакеты со скидкой`
    },
    featureList: [
      "ИИ-генерация основы истории по одной идее",
      "Персонажи с портретами и описаниями",
      "Интерактивная карта связей между героями",
      "Редактор глав с учётом отношений на карте",
      `Видео-серии из портретов через ${BRAND.googleVeo} ${BRAND.veoVersion}`,
      STORY_PREMIUM_SHORT,
      "Оплата без подписки — только за результат"
    ],
    audience: {
      "@type": "Audience",
      audienceType: "Писатели, сценаристы и авторы фанфиков"
    }
  };
}

function buildBreadcrumbs(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

function buildFaqPage() {
  const faq = getStoryStudioFaqItems();

  return {
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function buildStoryStudioHomeJsonLd() {
  const pageUrl = absoluteUrl("/storystudio");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...publisherOrg,
        logo: absoluteUrl("/logo.png"),
        sameAs: [pageUrl, "https://avenir-team.ru/"]
      },
      {
        "@type": "WebSite",
        name: storyStudioConfig.name,
        url: pageUrl,
        inLanguage: "ru-RU",
        description: storyStudioConfig.description,
        publisher: publisherOrg
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: storyStudioConfig.title,
        url: pageUrl,
        description: storyStudioConfig.description,
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          url: pageUrl,
          name: storyStudioConfig.name
        },
        about: {
          "@type": "Thing",
          name: "ИИ генератор художественных историй"
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl(storyStudioConfig.ogImagePath)
        },
        publisher: publisherOrg
      },
      buildBreadcrumbs([
        { name: "Главная", path: "/" },
        { name: BRAND.storyStudio, path: "/storystudio" }
      ]),
      buildStorySoftwareApplication(pageUrl),
      buildStoryOfferCatalog(),
      buildFaqPage(),
      {
        "@type": "HowTo",
        name: `Как создать историю в ${BRAND.storyStudio}`,
        description: "Пошаговый сценарий от идеи до кабинета с персонажами, картой связей и главами",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Опишите идею",
            text: "Укажите название, жанры и основную завязку произведения на странице создания."
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Получите основу",
            text: "ИИ сгенерирует синопсис, мир, персонажей, связи и план сюжета."
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Развивайте в кабинете",
            text: "Добавляйте главы, портреты, связи на карте и видео-серии из героев."
          }
        ]
      },
      {
        "@type": "ItemList",
        name: `Сценарии для авторов ${BRAND.storyStudio}`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Генератор фанфиков", url: absoluteUrl("/storystudio/fanfik") },
          { "@type": "ListItem", position: 2, name: "Генератор романа", url: absoluteUrl("/storystudio/roman") },
          { "@type": "ListItem", position: 3, name: "ИИ для сценариев", url: absoluteUrl("/storystudio/scenarii") },
          { "@type": "ListItem", position: 4, name: "Генератор персонажей", url: absoluteUrl("/storystudio/personazhi") }
        ]
      },
      {
        "@type": "Service",
        name: `Видео-серии из персонажей ${BRAND.storyStudio}`,
        description: `Кинематографичные сцены из ИИ-портретов героев через ${BRAND.googleVeo} ${BRAND.veoVersion}. От ${VIDEO_STANDARD_PRICE_4_SEC} сек, формат 9:16 для соцсетей.`,
        provider: publisherOrg,
        areaServed: "RU",
        url: absoluteUrl("/storystudio#video-series")
      },
      {
        "@type": "VideoObject",
        name: STORYSTUDIO_VIDEO_DEMO.title,
        description: STORYSTUDIO_VIDEO_DEMO.description,
        contentUrl: absoluteUrl(STORYSTUDIO_VIDEO_DEMO.src),
        embedUrl: absoluteUrl("/storystudio#video-series"),
        uploadDate: new Date().toISOString().slice(0, 10),
        inLanguage: "ru-RU",
        isFamilyFriendly: true,
        publisher: publisherOrg
      }
    ]
  };
}

export function buildStoryStudioCreateJsonLd() {
  const pageUrl = absoluteUrl("/storystudio/create");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `Создать историю с ИИ — ${BRAND.storyStudio}`,
        url: pageUrl,
        description:
          "Форма создания истории: название, жанры, идея и объём. ИИ сгенерирует персонажей, мир и план сюжета.",
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          url: absoluteUrl("/storystudio"),
          name: storyStudioConfig.name
        },
        publisher: publisherOrg
      },
      buildBreadcrumbs([
        { name: BRAND.storyStudio, path: "/storystudio" },
        { name: "Создать историю", path: "/storystudio/create" }
      ]),
      {
        "@type": "HowTo",
        name: `Как создать историю в ${BRAND.storyStudio}`,
        description: "Пошаговое создание ИИ-основы художественного произведения",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Опишите идею",
            text: "Укажите название, жанры и основную идею произведения."
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Запустите генерацию",
            text: "ИИ создаст синопсис, мир, персонажей, связи и план сюжета."
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Развивайте в кабинете",
            text: "Добавляйте главы, портреты, связи на карте и видео-серии."
          }
        ]
      }
    ]
  };
}
