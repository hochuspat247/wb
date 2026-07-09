import { absoluteUrl, siteConfig } from "@/lib/seo";
import { getMarketingFaqItems } from "@/lib/marketing/faq";
import { PRODUCT_CARD_VIDEO_DEMO } from "@/lib/marketing/videoExample";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  FREE_TRIAL_CARDS,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  formatRub,
  formatVideoPriceRub,
  getVideoMarketingPrices
} from "@/lib/pricing";

function buildOfferCatalog() {
  const growthPack = calculatePackagePrice(5);
  const scalePack = calculatePackagePrice(20);
  const videoPrices = getVideoMarketingPrices("standard");

  return {
    "@type": "OfferCatalog",
    name: "Тарифы MarketCard AI",
    itemListElement: [
      {
        "@type": "Offer",
        name: `${FREE_TOTAL_MARKETING_CARDS} бесплатные карточки`,
        price: "0",
        priceCurrency: "RUB",
        description: "Тестовый доступ без карты",
        url: absoluteUrl("/register"),
        itemOffered: {
          "@type": "Service",
          name: "Генерация карточки товара",
          description: "AI-обложка 4:5, тексты и SEO для маркетплейсов"
        }
      },
      {
        "@type": "Offer",
        name: "1 фото",
        price: String(CARD_GENERATION_PRICE_RUB),
        priceCurrency: "RUB",
        description: "Разовая генерация обложки",
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Генерация карточки товара"
        }
      },
      {
        "@type": "Offer",
        name: "Пакет 5 фото",
        price: String(growthPack.total),
        priceCurrency: "RUB",
        description: `${formatRub(growthPack.pricePerUnit)} за карточку`,
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Пакет генераций карточек"
        }
      },
      {
        "@type": "Offer",
        name: "Пакет 20 фото",
        price: String(scalePack.total),
        priceCurrency: "RUB",
        description: `${formatRub(scalePack.pricePerUnit)} за карточку`,
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Пакет генераций карточек"
        }
      },
      ...videoPrices.map((item) => ({
        "@type": "Offer",
        name: `Видео из карточки ${item.duration} сек`,
        price: String(item.priceRub),
        priceCurrency: "RUB",
        description: "Google Veo 3.1 Fast, без звука, из готовой карточки",
        url: absoluteUrl("/#video-pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Видео из карточки товара"
        }
      }))
    ]
  };
}

export function buildHomeJsonLd() {
  const faq = getMarketingFaqItems();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/logo.png"),
        email: "avenir.team.corp@gmail.com"
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "ru-RU",
        description: siteConfig.description
      },
      {
        "@type": "WebPage",
        name: siteConfig.title,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          url: absoluteUrl("/")
        }
      },
      {
        "@type": "SoftwareApplication",
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: siteConfig.description,
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: String(CARD_GENERATION_PRICE_RUB),
          priceCurrency: "RUB",
          offerCount: String(3 + getVideoMarketingPrices("standard").length),
          description: `${FREE_TOTAL_MARKETING_CARDS} бесплатно, далее от ${formatRub(CARD_GENERATION_PRICE_RUB)} за фото, видео от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}`
        },
        featureList: [
          "Генерация карточки товара по фото",
          "Тексты и SEO для WB, Ozon, Avito",
          "AI-обложка 4:5",
          "Видео из готовой карточки без звука"
        ],
        url: absoluteUrl("/cabinet")
      },
      buildOfferCatalog(),
      {
        "@type": "VideoObject",
        name: PRODUCT_CARD_VIDEO_DEMO.title,
        description: PRODUCT_CARD_VIDEO_DEMO.description,
        contentUrl: absoluteUrl(PRODUCT_CARD_VIDEO_DEMO.src),
        embedUrl: absoluteUrl("/#video-example"),
        uploadDate: new Date().toISOString().slice(0, 10),
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
