import { BRAND } from "@/lib/branding";
import {
  CARD_GENERATION_PRICE_RUB,
  GENERATION_TIME_COPY,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_PRICE_RUB,
  SKU_KIT_SLIDE_COUNT,
  describeFreeQuotaMarketing,
  describeMonthlyFreeReset,
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
      id: "wb-connect",
      question: "Как подключить аккаунт Wildberries?",
      answer:
        "Подробная инструкция — на странице /wildberries и в кабинете: Кабинет → Настройки → Wildberries API. Кратко: создайте токен с категорией «Контент» (чтение и запись) на seller.wildberries.ru и вставьте его в МаркетКард."
    },
    {
      id: "wildberries",
      question: "Можно ли посмотреть и отредактировать карточки, которые уже есть на WB?",
      answer:
        "Да. В кабинете откройте вкладку «Wildberries»: подтянутся активные карточки и карточки из корзины WB. Можно открыть карточку, изменить название, описание, бренд и габариты и сохранить обратно в Wildberries."
    },
    {
      id: "carousel",
      question: "Что такое комплект для одного товара?",
      answer: `Это готовый набор из ${SKU_KIT_SLIDE_COUNT} связанных слайдов для одного SKU: титульная обложка, преимущества, характеристики, сценарий использования и дополнительный рекламный вариант — плюс тексты и СЕО. Цена — ${formatRub(SKU_KIT_PRICE_RUB)} без подписки.`
    },
    {
      id: "publish",
      question: "Можно ли опубликовать карточку прямо на Wildberries?",
      answer: `Да, с тарифа «${PLAN_SKU_KIT_NAME}» (от ${formatRub(SKU_KIT_PRICE_RUB)}). Подключите WB API в настройках, соберите карусель и отправьте тексты и изображения в WB.`
    },
    {
      id: "free",
      question: "Можно ли попробовать бесплатно?",
      answer: `Да, ${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}. Далее — комплект для одного товара или ${formatRub(CARD_GENERATION_PRICE_RUB)} за слайд.`
    },
    {
      id: "watermark",
      question: "Почему на карточке есть демо-метка?",
      answer:
        "Демо без входа показывается с защитной меткой. После регистрации можно один раз скачать карточку без водяного знака. Дальше нужны купленные комплекты."
    },
    {
      id: "pricing",
      question: "Сколько стоит комплект карточек?",
      answer: `Основная единица продажи — «${PLAN_SKU_KIT_NAME}»: ${SKU_KIT_SLIDE_COUNT} связанных слайдов за ${formatRub(SKU_KIT_PRICE_RUB)}. Поштучно один слайд — ${formatRub(CARD_GENERATION_PRICE_RUB)}. Каталог на 20 слайдов дешевле за слайд.`
    },
    {
      id: "timing",
      question: "Сколько занимает генерация?",
      answer: `${GENERATION_TIME_COPY}. Точное время зависит от очереди и загруженности провайдера изображений.`
    },
    {
      id: "failed-generation",
      question: "Что если генерация не удалась или этикетка искажена?",
      answer:
        "При сбое генерации попытка не списывается — можно запустить снова. Если этикетка или детали товара искажены, напишите в поддержку или перегенерируйте слайд: при техническом сбое кредит возвращается. Сервис не добавляет выдуманные свойства товара — опирается на фото и описание."
    },
    {
      id: "video",
      question: "Как работает видео из карточки и сколько оно стоит?",
      answer: `Видео — дополнительная опция после готового изображения. Через ${BRAND.googleVeo} ${BRAND.veoVersion} Фаст: плавный зум и движение без искажения товара. Всегда без звука, оплачивается отдельно. Стандарт (1080p): ${videoExamples}.`
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
        "Для первого комплекта карточек — нет. Сервис помогает быстро собрать тексты, СЕО и слайды, которые можно тестировать в листинге."
    },
    {
      id: "demo-after-register",
      question: "Что происходит с демо-карточкой после регистрации?",
      answer:
        "Демо автоматически сохраняется в истории. После входа можно один раз скачать результат без водяного знака."
    },
    {
      id: "ai-image",
      question: "Почему ИИ-картинка может не сгенерироваться?",
      answer:
        "Генерация зависит от провайдера и лимитов API. Если связь прервётся или результат не создастся, списание не произойдёт — повторите попытку."
    }
  ];
}
