import { FREE_TRIAL_CARDS, MONTHLY_FREE_RESET_DAYS } from "@/lib/pricing";

export const HERO_BENEFITS = [
  "1 демо без входа",
  "~60 сек до результата",
  `${FREE_TRIAL_CARDS} карточки каждый месяц`,
  `Обновление каждые ${MONTHLY_FREE_RESET_DAYS} дней`
] as const;
