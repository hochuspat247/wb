import { BRAND } from "@/lib/branding";
import { absoluteUrl, siteConfig } from "@/lib/seo";
import { kvartovidConfig } from "@/lib/seo/kvartovid";
import { getKvartovidFaqItems } from "@/lib/kvartovid/marketingFaq";
import { kvartovidMarketingPages, type KvartovidMarketingPage } from "@/lib/kvartovid/marketingPages";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";

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

function buildKvartovidOfferCatalog() {
  return {
    "@type": "OfferCatalog",
    name: `Тарифы ${BRAND.kvartovid}`,
    itemListElement: [
      {
        "@type": "Offer",
        name: "Пробное объявление",
        price: "0",
        priceCurrency: "RUB",
        description: "1 объявление с водяным знаком на обложке",
        url: absoluteUrl("/kvartovid/create"),
        itemOffered: {
          "@type": "Service",
          name: "Упаковка объявления о недвижимости",
          description: "Тексты для Авито, Циан и Домклик"
        }
      },
      {
        "@type": "Offer",
        name: "1 объект",
        price: String(KVARTOVID_PRICES.listing),
        priceCurrency: "RUB",
        description: "Полный текст объявления без водяного знака",
        url: absoluteUrl("/kvartovid#pricing"),
        itemOffered: {
          "@type": "Service",
          name: `Генерация объявления ${BRAND.kvartovid}`
        }
      },
      {
        "@type": "Offer",
        name: "Объект + обложка",
        price: String(KVARTOVID_PRICES.listingWithCover),
        priceCurrency: "RUB",
        description: "Тексты и AI-обложка для площадок",
        url: absoluteUrl("/kvartovid#pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Объявление с AI-обложкой"
        }
      },
      {
        "@type": "Offer",
        name: "Пакет 10 объектов",
        price: String(KVARTOVID_PRICES.pack10),
        priceCurrency: "RUB",
        description: "Для риэлторов и агентств",
        url: absoluteUrl("/kvartovid/rieltor"),
        itemOffered: {
          "@type": "Service",
          name: "Пакет упаковки объектов"
        }
      }
    ]
  };
}

function buildKvartovidSoftwareApplication(url: string) {
  return {
    "@type": "SoftwareApplication",
    name: kvartovidConfig.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "RealEstateApplication",
    operatingSystem: "Web",
    description: kvartovidConfig.description,
    url,
    inLanguage: ["ru-RU"],
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: String(KVARTOVID_PRICES.pack10),
      priceCurrency: "RUB",
      offerCount: "4",
      description: `От ${formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект, обложка от ${formatKvartovidRub(KVARTOVID_PRICES.listingWithCover)}`
    },
    featureList: [
      "ИИ-заголовок и описание квартиры по фото и параметрам",
      "Отдельные тексты для Авито, Циан и Домклик",
      "AI-обложка объявления с плашкой преимуществ",
      "Схематическая планировка квартиры для скачивания SVG и PNG",
      "Видео из фото квартиры через Google Veo",
      "Кабинет с историей объектов",
      "Оплата без подписки — за результат"
    ],
    audience: {
      "@type": "Audience",
      audienceType: "Риэлторы, арендодатели и продавцы квартир"
    }
  };
}

function buildFaqPage() {
  const faq = getKvartovidFaqItems();

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

function buildUseCaseItemList() {
  return {
    "@type": "ItemList",
    name: `Сценарии ${BRAND.kvartovid}`,
    itemListElement: kvartovidMarketingPages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.h1,
      url: absoluteUrl(page.path)
    }))
  };
}

export function buildKvartovidHomeJsonLd() {
  const pageUrl = absoluteUrl("/kvartovid");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/logo.png"),
        email: "avenir.team.corp@gmail.com",
        sameAs: [pageUrl]
      },
      {
        "@type": "WebSite",
        name: kvartovidConfig.name,
        url: pageUrl,
        inLanguage: "ru-RU",
        description: kvartovidConfig.description,
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: absoluteUrl("/")
        }
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: kvartovidConfig.title,
        url: pageUrl,
        description: kvartovidConfig.description,
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          url: pageUrl,
          name: kvartovidConfig.name
        },
        about: {
          "@type": "Thing",
          name: "ИИ-упаковка объявлений о недвижимости"
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl(kvartovidConfig.ogImagePath)
        }
      },
      buildBreadcrumbs([
        { name: "Главная", path: "/" },
        { name: BRAND.kvartovid, path: "/kvartovid" }
      ]),
      buildKvartovidSoftwareApplication(pageUrl),
      buildKvartovidOfferCatalog(),
      buildFaqPage(),
      buildUseCaseItemList(),
      {
        "@type": "HowTo",
        name: `Как сделать объявление о квартире в ${BRAND.kvartovid}`,
        description: "Пошаговая упаковка объявления: фото, параметры, тексты, обложка и планировка",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Загрузите фото",
            text: "Добавьте 3–10 снимков квартиры: комнаты, кухня, санузел, двор."
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Укажите параметры",
            text: "Комнаты, площадь, цена, город, метро и тип сделки."
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Получите упаковку",
            text: "ИИ подготовит заголовок, описания для площадок, преимущества, обложку и схему планировки."
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Опубликуйте",
            text: "Скопируйте текст и скачайте обложку для Авито, Циан или Домклик."
          }
        ]
      },
      {
        "@type": "Service",
        name: `Генератор объявлений о недвижимости ${BRAND.kvartovid}`,
        description:
          "Сервис для продажи и аренды квартир: ИИ-тексты, обложки, планировки и видео из фото объекта.",
        provider: {
          "@type": "Organization",
          name: kvartovidConfig.name
        },
        areaServed: {
          "@type": "Country",
          name: "Россия"
        },
        serviceType: "Real estate listing copywriting and visual packaging",
        url: pageUrl
      }
    ]
  };
}

export function buildKvartovidCreateJsonLd() {
  const pageUrl = absoluteUrl("/kvartovid/create");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `Создать объявление о квартире — ${BRAND.kvartovid}`,
        url: pageUrl,
        description:
          "Загрузите фото квартиры и параметры объекта — ИИ сгенерирует тексты для Авито, Циан, Домклик, обложку и планировку.",
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          url: absoluteUrl("/kvartovid"),
          name: kvartovidConfig.name
        }
      },
      buildBreadcrumbs([
        { name: BRAND.kvartovid, path: "/kvartovid" },
        { name: "Создать объявление", path: "/kvartovid/create" }
      ]),
      {
        "@type": "HowTo",
        name: `Как создать объявление в ${BRAND.kvartovid}`,
        description: "Форма генерации объявления о недвижимости за 1 минуту",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Загрузите фото",
            text: "Минимум 3 снимка интерьера и объекта."
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Заполните параметры",
            text: "Комнаты, площадь, город, цена и тип сделки."
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Сгенерируйте",
            text: "Получите тексты, обложку, планировку и сохранение в кабинете."
          }
        ]
      }
    ]
  };
}

export function buildKvartovidUseCaseJsonLd(page: KvartovidMarketingPage) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: absoluteUrl(page.path),
        inLanguage: "ru-RU",
        keywords: page.keywords.join(", "),
        isPartOf: {
          "@type": "WebSite",
          name: kvartovidConfig.name,
          url: absoluteUrl("/kvartovid")
        },
        about: {
          "@type": "Thing",
          name: page.badge
        }
      },
      buildBreadcrumbs([
        { name: BRAND.kvartovid, path: "/kvartovid" },
        { name: page.badge, path: page.path }
      ]),
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      },
      {
        "@type": "Service",
        name: page.h1,
        description: page.lead,
        provider: {
          "@type": "Organization",
          name: kvartovidConfig.name
        },
        areaServed: "RU",
        url: absoluteUrl(page.path)
      }
    ]
  };
}
