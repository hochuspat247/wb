import { absoluteUrl, siteConfig } from "@/lib/seo";

const faq = [
  {
    question: "Можно ли попробовать бесплатно?",
    answer: "Да, можно создать 3 тестовые карточки без карты."
  },
  {
    question: "Это уже публикует карточку на WB/Ozon?",
    answer: "В текущей версии доступна генерация и экспорт. Прямая публикация через API запланирована в следующих версиях."
  },
  {
    question: "Что происходит с фото товара?",
    answer: "Фото используется для генерации карточки и предпросмотра. Результат можно скачать и сохранить в истории."
  }
];

export function HomeJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "ru-RU",
        description: siteConfig.description
      },
      {
        "@type": "SoftwareApplication",
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "RUB",
          description: "3 бесплатные генерации карточек"
        },
        url: absoluteUrl("/cabinet")
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

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
}
