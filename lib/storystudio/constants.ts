import type { StoryGenre } from "@/types/storystudio";

export const STORY_GENRES: { id: StoryGenre; label: string; emoji: string }[] = [
  { id: "fantasy", label: "Фэнтези", emoji: "🐉" },
  { id: "romance", label: "Романтика", emoji: "💫" },
  { id: "sci-fi", label: "Научная фантастика", emoji: "🚀" },
  { id: "mystery", label: "Детектив", emoji: "🔍" },
  { id: "horror", label: "Хоррор", emoji: "🌑" },
  { id: "drama", label: "Драма", emoji: "🎭" },
  { id: "adventure", label: "Приключения", emoji: "⚔️" },
  { id: "dark-academia", label: "Dark academia", emoji: "📚" },
  { id: "enemies-to-lovers", label: "Enemies to lovers", emoji: "🔥" },
  { id: "found-family", label: "Found family", emoji: "🫂" }
];

export const WORD_COUNT_PRESETS = [
  { value: 8000, label: "~8 тыс. слов", short: "Новелла" },
  { value: 16000, label: "~16 тыс. слов", short: "Повесть" },
  { value: 40000, label: "~40 тыс. слов", short: "Роман" },
  { value: 80000, label: "~80 тыс. слов", short: "Эпик" }
];

export const EXAMPLE_STORIES = [
  {
    type: "Персонаж",
    title: "Гермиона в запретном архиве",
    description: "В школьном архиве спрятаны письма из будущего, и она первой понимает, что кто-то уже переписывает судьбу мира.",
    tags: ["магия", "тайна", "академия"]
  },
  {
    type: "Сюжет",
    title: "Письма от самого себя из будущего",
    description: "Каждое новое письмо помогает избежать беды, но приближает ту версию будущего, из которой оно было отправлено.",
    tags: ["время", "письма", "выбор"]
  },
  {
    type: "Вайб",
    title: "Dark academia и forbidden magic",
    description: "Старые библиотеки, мокрый камень, опасное знание и чувство, что запретный ритуал уже начал менять тех, кто подошёл слишком близко.",
    tags: ["вайб", "академия", "запретное"]
  },
  {
    type: "Вселенная",
    title: "Парящие острова и штормовая корона",
    description: "Корона, управляющая ветрами, держит острова в небе, но каждый новый шторм показывает, что её власть уже трескается.",
    tags: ["острова", "небо", "магия"]
  }
];

export const STORY_STATS = [
  { value: "1 247", label: "Историй создано" },
  { value: "4 891", label: "Персонажей проработано" },
  { value: "12 340", label: "Глав сгенерировано" },
  { value: "428", label: "Видео-серий снято" }
];

export const VIDEO_ADVANTAGE_POINTS = [
  "Google Veo 3.1 — киношное видео из портрета персонажа",
  "Собирайте серии сцен как эпизоды вашего мира",
  "Вертикальный формат 9:16 для Reels, Shorts и TikTok",
  "От 152 ₽ за 4 сек — озвучка и ambient по желанию"
];

export const RELATION_ADVANTAGE_POINTS = [
  "Перетаскивайте героев на карте и соединяйте стрелками — Shift + drag",
  "7 типов связей: союзник, враг, любовь, семья, наставник, соперник",
  "Описание и сила связи — AI видит вашу драматургию",
  "Каждая новая глава строится с учётом отношений на карте"
];
