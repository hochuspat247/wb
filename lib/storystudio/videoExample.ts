import { BRAND } from "@/lib/branding";

export const STORYSTUDIO_VIDEO_DEMO = {
  src: "/examples/storystudio-promo-demo.mp4",
  title: `Пример видео-серии ${BRAND.storyStudio}`,
  kicker: `${BRAND.googleVeo} ${BRAND.veoVersion}`,
  description:
    "Рекламный пример: ИИ-портрет персонажа превращается в кинематографичную сцену. Такие ролики можно собирать в серии для Рилс, Шортс и ТикТок.",
  badge: "Пример серии",
  durationLabel: "Рекламный ролик",
  features: [
    "Портрет героя → живая сцена",
    "Вертикальный формат для соцсетей",
    "Фоновый звук и атмосфера по желанию",
    "Серии сохраняются в истории"
  ] as const
} as const;
