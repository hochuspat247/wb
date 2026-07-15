import { absoluteUrl, siteConfig } from "@/lib/seo";
import { BRAND } from "@/lib/branding";
import { getMarketingFaqItems } from "@/lib/marketing/faq";
import { PRODUCT_CARD_VIDEO_DEMO } from "@/lib/marketing/videoExample";
import {
  CATALOG_PACK_PRICE_RUB,
  FREE_TRIAL_CARDS,
  KIT_SERIES_DESCRIPTION,
  PLAN_CATALOG_NAME,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_PRICE_RUB,
  SKU_KIT_SLIDE_COUNT,
  VIDEO_GENERATION_START_PRICE_RUB,
  describeFreeQuotaMarketing,
  describeMonthlyFreeReset,
  formatVideoPriceRub,
  getVideoMarketingPrices
} from "@/lib/pricing";

function buildPaidOffers() {
  return [
    {
      "@type": "Offer",
      name: PLAN_SKU_KIT_NAME,
      price: String(SKU_KIT_PRICE_RUB),
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/#pricing"),
      description: `${KIT_SERIES_DESCRIPTION}. Скачивание без водяного знака. Разовая оплата, без подписки.`,
      itemOffered: {
        "@type": "Service",
        name: PLAN_SKU_KIT_NAME,
        description: KIT_SERIES_DESCRIPTION
      }
    },
    {
      "@type": "Offer",
      name: PLAN_CATALOG_NAME,
      price: String(CATALOG_PACK_PRICE_RUB),
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/#pricing"),
      description: `20 слайдов — до 4 комплектов для разных товаров. Скачивание без водяного знака.`,
      itemOffered: {
        "@type": "Service",
        name: PLAN_CATALOG_NAME
      }
    },
    {
      "@type": "Offer",
      name: `${FREE_TRIAL_CARDS} пробные карточки`,
      price: "0",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/register"),
      description: `${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}`,
      itemOffered: {
        "@type": "Service",
        name: "Пробные карточки товара",
        description: "Одиночные карточки с водяным знаком после регистрации"
      }
    },
    ...getVideoMarketingPrices("standard").map((item) => ({
      "@type": "Offer",
      name: `Видео из карточки ${item.duration} сек`,
      price: String(item.priceRub),
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/#video-pricing"),
      description: `${BRAND.googleVeo} ${BRAND.veoVersion} Фаст, без звука, из готовой карточки`,
      itemOffered: {
        "@type": "Service",
        name: "Видео из карточки товара"
      }
    }))
  ];
}

export function buildHomeJsonLd() {
  const faq = getMarketingFaqItems();
  const offers = buildPaidOffers();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl(`/icon-512-v2.png`),
        email: "avenir.team.corp@gmail.com"
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "ru-RU",
        description: siteConfig.description,
        publisher: { "@id": `${absoluteUrl("/")}#organization` }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Главная",
            item: absoluteUrl("/")
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl("/")}#webpage`,
        name: siteConfig.title,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: "ru-RU",
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        about: { "@id": `${absoluteUrl("/")}#software` }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/")}#software`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: siteConfig.description,
        url: absoluteUrl("/"),
        offers,
        featureList: [
          "Генерация карточки товара по фото",
          "Тексты и СЕО для ВБ, Озон и Авито",
          "ИИ-обложка 4:5",
          `${PLAN_SKU_KIT_NAME}: ${SKU_KIT_SLIDE_COUNT} слайдов`,
          "Публикация на Wildberries через API",
          `Видео из готовой карточки от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}`
        ]
      },
      {
        "@type": "Service",
        name: "Генерация карточек товара для маркетплейсов",
        description: siteConfig.description,
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        areaServed: {
          "@type": "Country",
          name: "Россия"
        },
        serviceType: "ИИ-генерация карточек товара",
        url: absoluteUrl("/"),
        offers
      },
      {
        "@type": "HowTo",
        name: "Как сделать карточку товара для маркетплейса",
        description: "Пошаговый процесс создания карточки товара в МаркетКард",
        step: [
          {
            "@type": "HowToStep",
            name: "Загрузите фото товара",
            text: "Добавьте исходное фото товара в генератор на главной странице или в кабинете."
          },
          {
            "@type": "HowToStep",
            name: "Получите обложку 4:5, описание и СЕО",
            text: "Сервис подготовит визуал, название, описание и ключевые слова для маркетплейса."
          },
          {
            "@type": "HowToStep",
            name: "Проверьте пробную карточку",
            text: "На бесплатном тарифе доступны демо и пробные карточки с водяным знаком."
          },
          {
            "@type": "HowToStep",
            name: "Закажите комплект для одного товара",
            text: `${KIT_SERIES_DESCRIPTION} без водяного знака — разовая оплата ${SKU_KIT_PRICE_RUB} ₽.`
          },
          {
            "@type": "HowToStep",
            name: "Скачайте или опубликуйте на Wildberries",
            text: "Скачайте PNG или отправьте карусель на Wildberries через API из кабинета."
          }
        ]
      },
      {
        "@type": "OfferCatalog",
        name: `Тарифы ${BRAND.marketCard}`,
        itemListElement: offers.map((offer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: offer
        }))
      },
      {
        "@type": "VideoObject",
        name: PRODUCT_CARD_VIDEO_DEMO.title,
        description: PRODUCT_CARD_VIDEO_DEMO.description,
        contentUrl: absoluteUrl(PRODUCT_CARD_VIDEO_DEMO.src),
        embedUrl: absoluteUrl("/#video-example"),
        thumbnailUrl: absoluteUrl("/opengraph-image"),
        uploadDate: "2026-03-01",
        inLanguage: "ru-RU",
        isFamilyFriendly: true
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ]
  };
}
