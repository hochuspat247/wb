import { BRAND } from "@/lib/branding";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";

export type KvartovidFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function getKvartovidFaqItems(): KvartovidFaqItem[] {
  return [
    {
      id: "what",
      question: `Что делает ${BRAND.kvartovid}?`,
      answer:
        "Загружаете фото квартиры и параметры объекта — сервис готовит заголовок, описание, список преимуществ и AI-обложку для публикации на площадках."
    },
    {
      id: "mvp",
      question: "Что входит в MVP на первый запуск?",
      answer:
        "Загрузка 3–10 фото, ввод параметров, генерация заголовка, описания, преимуществ, обложки и экспорт текста с картинкой. Видео, чеклист и варианты под Циан/Домклик — в следующих релизах."
    },
    {
      id: "cover",
      question: "Как работает AI-обложка?",
      answer:
        "ИИ выбирает лучший кадр, улучшает свет и композицию и добавляет аккуратную плашку с преимуществами — например: «2-комнатная у парка», «7 минут до метро», «свежий ремонт»."
    },
    {
      id: "truth",
      question: "ИИ не выдумывает факты?",
      answer:
        "Сервис предлагает возможные сильные стороны, а вы выбираете только то, что соответствует реальности. Мы помогаем упаковать преимущества, а не отвечаем за сделку."
    },
    {
      id: "price",
      question: "Сколько стоит?",
      answer: `1 объявление бесплатно с водяным знаком. Далее — от ${formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект, ${formatKvartovidRub(KVARTOVID_PRICES.listingWithCover)} с обложкой, пакет 10 объектов — ${formatKvartovidRub(KVARTOVID_PRICES.pack10)}.`
    },
    {
      id: "platforms",
      question: "Будут ли отдельные тексты под Авито и Циан?",
      answer:
        "Да, в полной версии один объект даст разные варианты: живой текст для Авито, структурный для Циан, официальный для Домклик и короткий пост для Telegram/VK."
    }
  ];
}
