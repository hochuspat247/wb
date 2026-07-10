import { BRAND } from "@/lib/branding";
import {
  CARD_GENERATION_PRICE_RUB,
  FREE_TOTAL_MARKETING_CARDS,
  FREE_TRIAL_CARDS,
  formatRub,
  formatVideoPriceRub,
  getVideoMarketingPrices
} from "@/lib/pricing";

export type MarketingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function getMarketingFaqItems(): MarketingFaqItem[] {
  const videoExamples = getVideoMarketingPrices("standard")
    .map((item) => `${item.duration} сек — ${formatVideoPriceRub(item.priceRub)}`)
    .join(", ");

  return [
    {
      id: "publish",
      question: "Это уже публикует карточку на ВБ/Озон?",
      answer:
        "В текущей версии доступна генерация и экспорт. Прямая публикация через АПИ запланирована в следующих версиях."
    },
    {
      id: "free",
      question: "Можно ли попробовать бесплатно?",
      answer: `Да, 1 демо без входа и ${FREE_TRIAL_CARDS} карточки после регистрации — всего ${FREE_TOTAL_MARKETING_CARDS} бесплатно. Без водяного знака скачивается только первая генерация. Далее — ${formatRub(CARD_GENERATION_PRICE_RUB)} за одну генерацию фото.`
    },
    {
      id: "watermark",
      question: "Почему на карточке есть демо-метка?",
      answer:
        "Все бесплатные карточки показываются с защитной меткой, кроме первой — её можно скачать без водяного знака. После покупки пакета все ранее созданные карточки в истории разблокируются."
    },
    {
      id: "pricing",
      question: "Сколько стоит одна карточка?",
      answer: `${formatRub(CARD_GENERATION_PRICE_RUB)} за одну ИИ-генерацию обложки 4:5 с текстами и СЕО. Пакеты дешевле: чем больше объём, тем ниже цена за фото — калькулятор на странице тарифов.`
    },
    {
      id: "video",
      question: "Как работает видео из карточки и сколько оно стоит?",
      answer: `После создания карточки в кабинете можно оживить её в короткий ролик через ${BRAND.googleVeo} ${BRAND.veoVersion} Фаст: плавный зум, параллакс и мягкое движение без искажения товара. Видео всегда без звука и оплачивается отдельно. Стандарт (1080p): ${videoExamples}. Минимальная длительность — 4 секунды.`
    },
    {
      id: "photo",
      question: "Что происходит с фото товара?",
      answer: "Фото используется для генерации карточки и предпросмотра. Результат можно скачать и сохранить в истории."
    },
    {
      id: "designer",
      question: "Нужен ли дизайнер?",
      answer:
        "Для первого варианта карточки — нет. Сервис помогает быстро собрать текст, СЕО и обложку, которую можно тестировать."
    },
    {
      id: "demo-after-register",
      question: "Что происходит с демо-карточкой после регистрации?",
      answer:
        "Демо-карточка автоматически сохраняется в истории личного кабинета. После входа откройте раздел «История» и скачайте первую карточку без водяного знака."
    },
    {
      id: "ai-image",
      question: "Почему ИИ-картинка может не сгенерироваться?",
      answer:
        "Генерация изображений зависит от выбранного провайдера и лимитов АПИ. Если связь прервётся, повторите генерацию — списание не произойдёт."
    }
  ];
}
