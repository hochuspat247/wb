import { absoluteUrl, siteConfig } from "@/lib/seo";
import { BRAND } from "@/lib/branding";
import { getMarketingFaqItems } from "@/lib/marketing/faq";
import { PRODUCT_CARD_VIDEO_DEMO } from "@/lib/marketing/videoExample";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TRIAL_CARDS,
  PLAN_CATALOG_NAME,
  PLAN_SKU_KIT_NAME,
  VIDEO_GENERATION_START_PRICE_RUB,
  calculatePackagePrice,
  describeFreeQuotaMarketing,
  describeMonthlyFreeReset,
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
    name: `Тарифы ${BRAND.marketCard}`,
    itemListElement: [
      {
        "@type": "Offer",
        name: `${FREE_TRIAL_CARDS} пробные карточки с водяным знаком`,
        price: "0",
        priceCurrency: "RUB",
        description: `${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}`,
        url: absoluteUrl("/register"),
        itemOffered: {
          "@type": "Service",
          name: "Пробные карточки товара",
          description: "ИИ-обложка 4:5 с водяным знаком; серия инфографики — в платном комплекте"
        }
      },
      {
        "@type": "Offer",
        name: "1 слайд",
        price: String(CARD_GENERATION_PRICE_RUB),
        priceCurrency: "RUB",
        description: "Разовый слайд для доработки комплекта",
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: "Слайд карточки товара"
        }
      },
      {
        "@type": "Offer",
        name: PLAN_SKU_KIT_NAME,
        price: String(growthPack.total),
        priceCurrency: "RUB",
        description: `${formatRub(growthPack.pricePerUnit)} за слайд · 5 связанных слайдов для одного SKU`,
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: PLAN_SKU_KIT_NAME
        }
      },
      {
        "@type": "Offer",
        name: PLAN_CATALOG_NAME,
        price: String(scalePack.total),
        priceCurrency: "RUB",
        description: `${formatRub(scalePack.pricePerUnit)} за слайд · до 4 комплектов SKU`,
        url: absoluteUrl("/#pricing"),
        itemOffered: {
          "@type": "Service",
          name: PLAN_CATALOG_NAME
        }
      },
      ...videoPrices.map((item) => ({
        "@type": "Offer",
        name: `Видео из карточки ${item.duration} сек`,
        price: String(item.priceRub),
        priceCurrency: "RUB",
        description: `${BRAND.googleVeo} ${BRAND.veoVersion} Фаст, без звука, из готовой карточки`,
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
        description: siteConfig.description,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl("/")}#faq`
          },
          "query-input": "required name=search_term_string"
        }
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
          description: `${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()} Далее от ${formatRub(CARD_GENERATION_PRICE_RUB)} за слайд, видео от ${formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)}`
        },
        featureList: [
          "Генерация карточки товара по фото",
          "Тексты и СЕО для ВБ, Озон, Авито и Яндекс Маркета",
          "ИИ-обложка 4:5",
          "Карусель слайдов для карточки товара",
          "Публикация на Wildberries через API",
          "Редактирование карточек WB в каталоге",
          "Видео из готовой карточки без звука"
        ],
        url: absoluteUrl("/")
      },
      {
        "@type": "Service",
        name: "Генерация карточек товара для маркетплейсов",
        description: siteConfig.description,
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          url: absoluteUrl("/")
        },
        areaServed: {
          "@type": "Country",
          name: "Россия"
        },
        serviceType: "ИИ-генерация карточек товара",
        url: absoluteUrl("/")
      },
      {
        "@type": "HowTo",
        name: "Как сделать карточку товара для маркетплейса",
        description: "Пошаговый процесс генерации карточки товара в МаркетКард ИИ",
        step: [
          { "@type": "HowToStep", name: "Загрузите фото товара", text: "Добавьте исходное фото товара в генератор на главной странице или в кабинете." },
          { "@type": "HowToStep", name: "Опишите товар", text: "Укажите категорию, преимущества и площадку: Wildberries, Ozon, Авито или Яндекс Маркет." },
          { "@type": "HowToStep", name: "Получите тексты и СЕО", text: "Нейросеть подготовит название, описание и ключевые слова для поиска на маркетплейсе." },
          { "@type": "HowToStep", name: "Сгенерируйте обложку 4:5", text: "ИИ создаст визуал карточки с инфографикой под требования площадки." },
          { "@type": "HowToStep", name: "Соберите карусель слайдов", text: "Добавьте слайды преимуществ, характеристик и сценариев использования в кабинете." },
          { "@type": "HowToStep", name: "Опубликуйте или скачайте", text: "Скачайте PNG или отправьте карточку на Wildberries через API из кабинета." }
        ]
      },
      buildOfferCatalog(),
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
