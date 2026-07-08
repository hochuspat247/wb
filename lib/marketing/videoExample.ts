import faceCreamAfter from "@/publick/8270a01e-bd48-4474-b18d-1a3b6eb2e6fc.png";

export const PRODUCT_CARD_VIDEO_DEMO = {
  src: "/examples/product-card-video-demo.mp4",
  cardImage: faceCreamAfter,
  title: "Пример видео из карточки товара",
  kicker: "Google Veo 3.1 Fast",
  description:
    "Потяните ползунок: слева статичная обложка 4:5, справа — тот же кадр, оживлённый в короткий ролик. Плавный zoom и мягкое движение без искажения текста.",
  compareLabel: "Оживление карточки",
  badge: "Veo 3.1 Fast",
  durationLabel: "8 сек · без звука",
  features: [
    "Готовая карточка остаётся основой кадра",
    "Вертикальный формат 4:5 → 9:16 в Veo",
    "Звук можно включить отдельной настройкой",
    "Скачивание и история в личном кабинете"
  ] as const
} as const;
