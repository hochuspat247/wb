import type { PlatformPageConfig } from "@/lib/marketing/platformPages";
import { absoluteUrl, siteConfig } from "@/lib/seo";
import { describeFreeQuotaMarketing, describeMonthlyFreeReset } from "@/lib/pricing";

function buildBreadcrumbs(page: PlatformPageConfig) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.h1,
        item: absoluteUrl(page.path)
      }
    ]
  };
}

export function buildPlatformJsonLd(page: PlatformPageConfig) {
  const graph: Record<string, unknown>[] = [
    buildBreadcrumbs(page),
    {
      "@type": "WebPage",
      name: page.title,
      headline: page.h1,
      description: page.description,
      url: absoluteUrl(page.path),
      inLanguage: "ru-RU",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl("/")
      },
      about: {
        "@type": "Thing",
        name: `Карточки товара ${page.marketplaceLabel}`
      }
    },
    {
      "@type": "Service",
      name: `Генератор карточек для ${page.marketplaceLabel}`,
      description: page.description,
      provider: {
        "@type": "Organization",
        name: siteConfig.name,
        url: absoluteUrl("/")
      },
      areaServed: {
        "@type": "Country",
        name: "Россия"
      },
      serviceType: "Генерация карточек товара с помощью ИИ",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RUB",
        description: `${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}`,
        url: absoluteUrl("/register")
      }
    },
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
    }
  ];

  if (page.howTo) {
    graph.push({
      "@type": "HowTo",
      name: page.howTo.name,
      description: page.howTo.description,
      step: page.howTo.steps.map((step) => ({
        "@type": "HowToStep",
        name: step.name,
        text: step.text,
        ...(step.url ? { url: step.url } : {})
      }))
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
