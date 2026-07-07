export const SECTION_LABELS: Record<string, string> = {
  hero: "Первый экран",
  "hero-mini-generator": "Демо-генератор",
  demo: "Демо-генератор",
  examples: "Примеры",
  compare: "Сравнение",
  how: "Как работает",
  pricing: "Тарифы",
  "pricing-calculator": "Калькулятор тарифов",
  testimonials: "Отзывы",
  faq: "FAQ",
  cabinet: "Кабинет",
  "demo-result": "Результат демо",
  login: "Вход",
  register: "Регистрация"
};

export const ACTION_LABELS: Record<string, string> = {
  hero_view: "Смотрит первый экран",
  hero_upload_zone_view: "Видит зону загрузки",
  hero_upload_click: "Клик по загрузке фото",
  hero_file_selected: "Выбрал файл",
  hero_example_selected: "Выбрал пример товара",
  hero_description_started: "Начал ввод описания",
  hero_description_filled: "Заполнил описание",
  hero_demo_generate_click: "Запустил демо-генерацию",
  hero_demo_generate_success: "Демо создано",
  hero_demo_generate_error: "Ошибка демо",
  hero_cta_click: "CTA «Загрузить фото»",
  header_try_click: "«Попробовать бесплатно»",
  examples_click: "«Посмотреть примеры»",
  photo_upload_started: "Начал загрузку фото",
  photo_uploaded: "Загрузил фото",
  description_filled: "Заполнил описание",
  demo_generation_started: "Генерация демо",
  demo_generation_completed: "Демо готово",
  demo_result_view: "Смотрит результат демо",
  download_original_click: "Скачать оригинал",
  auth_started_from_result: "Пошёл на авторизацию",
  link_click: "Клик по ссылке",
  ui_click: "Клик по элементу",
  page_view: "Открыл страницу"
};

export function getPathLabel(path: string) {
  const pathname = path.split("#")[0] || path;

  if (pathname.startsWith("/admin")) return "Админка";
  if (pathname.startsWith("/cabinet")) return "Кабинет";
  if (pathname.startsWith("/generations/")) return "Результат демо";
  if (pathname === "/login") return "Вход";
  if (pathname === "/register") return "Регистрация";
  if (pathname === "/") return "Главная";

  return pathname;
}

export function getSectionLabel(section?: string | null) {
  if (!section) return "Страница";
  return SECTION_LABELS[section] || section;
}

export function getActionLabel(action?: string | null, fallback?: string | null) {
  if (!action) return fallback || "Просматривает";
  return ACTION_LABELS[action] || fallback || action;
}

export const TRACKED_SECTION_IDS = [
  "hero",
  "hero-mini-generator",
  "demo",
  "examples",
  "compare",
  "how",
  "pricing",
  "pricing-calculator",
  "testimonials",
  "faq"
];
