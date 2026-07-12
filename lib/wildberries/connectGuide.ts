export const WB_SELLER_CABINET_URL = "https://seller.wildberries.ru/";
export const WB_API_INTEGRATIONS_URL = "https://seller.wildberries.ru/api-integrations";
export const WB_API_NEW_ACCESS_URL = "https://seller.wildberries.ru/supplier-settings/access-to-new-api";

export const WB_CONNECT_STEPS = [
  {
    title: "Откройте кабинет продавца Wildberries",
    text: "Перейдите по ссылке и войдите под владельцем аккаунта — только владелец может создавать API-токены.",
    href: WB_SELLER_CABINET_URL,
    linkLabel: "seller.wildberries.ru"
  },
  {
    title: "Откройте раздел «Интеграции по API»",
    text: "В меню профиля: Профиль → Интеграции по API. Если раздела нет в меню — используйте прямую ссылку ниже.",
    href: WB_API_INTEGRATIONS_URL,
    linkLabel: "Интеграции по API"
  },
  {
    title: "Создайте новый токен",
    text: "Нажмите «Создать токен». Выберите тип «Для собственного сервиса» (или «Персональный»), если сервиса МаркетКард нет в каталоге WB."
  },
  {
    title: "Включите доступ к категории «Контент»",
    text: "Отметьте категорию Контент с правами «Чтение и запись». Без неё не получится публиковать карточки, загружать фото и редактировать каталог."
  },
  {
    title: "Скопируйте токен",
    text: "WB показывает токен один раз. Сохраните его в надёжном месте — если потеряете, придётся создать новый."
  },
  {
    title: "Вставьте токен в МаркетКард",
    text: "Кабинет → Настройки → блок Wildberries API → вставьте токен → «Подключить WB». Также можно открыть вкладку Wildberries и нажать «Настройки WB»."
  }
] as const;

export const WB_CONNECT_REQUIREMENTS = [
  "Вход только под владельцем кабинета WB",
  "Категория API: Контент (чтение и запись)",
  "Токен вставляется в Настройки → Wildberries API"
] as const;
