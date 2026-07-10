import { BRAND } from "@/lib/branding";
import type { KvartovidDealType, KvartovidPropertyType } from "@/types/kvartovid";

export const KVARTOVID_TAGLINE = "Сделайте объявление о квартире за 1 минуту";

export const KVARTOVID_POSITIONING =
  "Фото квартиры → готовое объявление, обложка, планировка и видео за 1 минуту.";

export const DEAL_TYPE_LABELS: Record<KvartovidDealType, string> = {
  sale: "Продажа",
  rent: "Аренда",
  daily: "Посуточно"
};

export const PROPERTY_TYPE_LABELS: Record<KvartovidPropertyType, string> = {
  apartment: "Квартира",
  room: "Комната",
  house: "Дом",
  studio: "Студия"
};

export const KVARTOVID_PLATFORMS = [
  {
    id: "avito",
    label: "Авито",
    hint: "Живой продающий текст, как пишут на доске объявлений"
  },
  {
    id: "cian",
    label: "Циан",
    hint: "Структурный и спокойный — блоки, факты, без лишней эмоции"
  },
  {
    id: "domclick",
    label: "Домклик",
    hint: "Официальный деловой стиль банковской площадки"
  }
] as const;

export const KVARTOVID_AUDIENCES: Array<[string, string]> = [
  ["Риэлторы", "упаковывать поток объектов без рутины"],
  ["Частные арендодатели", "быстро сдать квартиру с сильным объявлением"],
  ["Агентства недвижимости", "единый стандарт текстов и обложек"],
  ["Застройщики", "продающие карточки лотов под площадки"],
  ["Самостоятельная продажа", "объявление без агентских шаблонов"],
  ["Посуточная аренда", "яркие обложки и короткие посты"]
];

export const KVARTOVID_KILLER_FEATURES = [
  {
    id: "cover",
    title: "AI-обложка объявления",
    description:
      "Загрузите фото квартиры — сервис выберет лучший кадр, улучшит свет и добавит плашку с преимуществами.",
    mvp: true
  },
  {
    id: "highlights",
    title: "Что подсветить в квартире",
    description:
      "ИИ анализирует фото и параметры, предлагает сильные стороны — вы выбираете только правдивые пункты.",
    mvp: true
  },
  {
    id: "platforms",
    title: "Объявление под площадку",
    description: "Авито, Циан и Домклик — отдельные заголовки и описания из одного объекта.",
    mvp: true
  },
  {
    id: "video",
    title: "Видео из фото квартиры",
    description: "Короткое видео 9:16, 16:9 или 1:1 через Google Veo 3.1 Fast — как в других продуктах.",
    mvp: true
  },
  {
    id: "floorplan",
    title: "Схема планировки",
    description:
      "Чертёж квартиры сверху по параметрам объекта — скачайте SVG или PNG и добавьте в объявление на Циан и Авито.",
    mvp: true
  },
  {
    id: "checklist",
    title: "Чеклист до публикации",
    description: "Подскажет, чего не хватает: фото кухни, санузла, плана, транспорта и яркости кадров.",
    mvp: false
  },
  {
    id: "score",
    title: "Оценка качества объявления",
    description: "Шкала готовности и конкретные советы: заголовок, метро, фото двора, конкретика вместо «хороший ремонт».",
    mvp: false
  },
  {
    id: "realtor",
    title: "Пакет для риэлтора",
    description: "10+ объектов в месяц: обложки, описания, видео, посты и история объектов.",
    mvp: false
  }
] as const;

export const KVARTOVID_STATS = [
  { value: "1 мин", label: "на упаковку объявления" },
  { value: "3–10", label: "фото на входе" },
  { value: "8", label: "форматов в полной версии" },
  { value: BRAND.kvartovid, label: "умный помощник, не шаблон" }
];
