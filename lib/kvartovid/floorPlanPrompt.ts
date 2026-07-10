import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import type { KvartovidListingInput } from "@/types/kvartovid";

export function buildKvartovidFloorPlanPrompt(input: KvartovidListingInput) {
  const deal = DEAL_TYPE_LABELS[input.dealType];
  const property = PROPERTY_TYPE_LABELS[input.propertyType];

  return [
    "Ты — архитектор-иллюстратор. Составь схематическую планировку квартиры сверху для объявления о недвижимости.",
    "Верни только JSON без markdown.",
    "",
    "Параметры:",
    `- Тип: ${property}, сделка: ${deal}`,
    `- Комнат: ${input.rooms}`,
    `- Общая площадь: ${input.area} м²`,
    input.floor != null ? `- Этаж: ${input.floor}${input.totalFloors ? ` из ${input.totalFloors}` : ""}` : null,
    `- Город: ${input.city}`,
    "",
    "Верни JSON:",
    `{`,
    `  "width": 1000,`,
    `  "height": 700,`,
    `  "rooms": [`,
    `    { "name": "Гостиная", "area": 18, "x": 200, "y": 0, "width": 500, "height": 350 }`,
    `  ]`,
    `}`,
    "",
    "Правила:",
    "- rooms: 4–8 зон (прихожая, кухня, комнаты, санузел, балкон/лоджия если уместно).",
    "- Координаты x,y,width,height в сетке width×height; комнаты не выходят за границы.",
    "- Комнаты стыкуются без больших пустот; типичная российская планировка для указанного числа комнат.",
    "- area каждой комнаты — приблизительная доля от общей площади; сумма близка к общей площади.",
    "- Названия комнат на русском: Гостиная, Спальня, Кухня, Прихожая, Санузел, Лоджия, Детская и т.д.",
    "- Это схема для объявления, не технический план БТИ — пропорции ориентировочные.",
    "- Для студии — одна жилая зона + кухня-ниша + санузел.",
    "- Для комнаты — комната + общие зоны (кухня, санузел) меньшего размера."
  ]
    .filter(Boolean)
    .join("\n");
}
