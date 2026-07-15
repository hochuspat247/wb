import { BRAND } from "@/lib/branding";
import { formatVideoPriceRub, VIDEO_STANDARD_PRICE_4_SEC } from "@/config/video-pricing";
import {
  STORY_FREE_PORTRAIT,
  STORY_FREE_TRIAL,
  STORY_GENERATION_EXPLAINER,
  STORY_GENERATION_PRICE_RUB,
  STORY_PACK_10_EXPLAINER,
  STORY_PREMIUM_SHORT,
  formatStoryRub
} from "@/lib/storystudio/pricing";

export type StoryStudioFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function getStoryStudioFaqItems(): StoryStudioFaqItem[] {
  return [
    {
      id: "what-is-storystudio",
      question: `Что такое ${BRAND.storyStudio}?`,
      answer: `${BRAND.storyStudio} — рабочая среда для длинных историй. Вы описываете идею, ИИ помогает собрать синопсис, мир, персонажей, план и главы. Контекст произведения сохраняется между сессиями — в отличие от обычного чата.`
    },
    {
      id: "vs-chat",
      question: `Чем ${BRAND.storyStudio} отличается от ChatGPT или Claude?`,
      answer: `Обычный чат пишет отдельные куски текста. ${BRAND.storyStudio} помнит мир, персонажей, отношения и предыдущие главы — и помогает вести цельное произведение в одном кабинете.`
    },
    {
      id: "how-to-create",
      question: "Как создать историю с ИИ?",
      answer: `Нажмите «Попробовать бесплатно», укажите название, жанры и идею. За 1–2 минуты появится основа. После регистрации проект сохраняется — можно продолжать главы, править персонажей и карту связей.`
    },
    {
      id: "what-is-generation",
      question: "Что такое «кредит» / «генерация»?",
      answer: STORY_GENERATION_EXPLAINER
    },
    {
      id: "pack-10",
      question: "Насколько хватит пакета из 10 кредитов?",
      answer: STORY_PACK_10_EXPLAINER
    },
    {
      id: "premium",
      question: "Что даёт Premium?",
      answer: `${STORY_PREMIUM_SHORT}. Открывается с пакетом «Автор» (50 кредитов) или «Студия».`
    },
    {
      id: "video-pricing",
      question: "Видео входит в пакет генераций?",
      answer: `Нет. Видео всегда оплачивается отдельно — от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)} за 4 сек через ${BRAND.googleVeo} ${BRAND.veoVersion}.`
    },
    {
      id: "share-read-pdf",
      question: "Можно ли поделиться историей, читать и сохранить PDF?",
      answer:
        "Да. Во вкладке «Читать» откройте доступ по ссылке, переключитесь в режим чтения и сохраните PDF через печать браузера."
    },
    {
      id: "analysis",
      question: "Как работает Анализ?",
      answer:
        "Откройте историю → «Анализ» → «Проанализировать историю». ИИ разберёт уже написанное и подскажет, что улучшить и что добавить."
    },
    {
      id: "relations-map",
      question: "Что такое карта связей?",
      answer:
        "Интерактивная карта героев со стрелками-связями. ИИ учитывает её при генерации новых глав — союзы, конфликты и напряжение не теряются."
    },
    {
      id: "free-tier",
      question: "Что доступно бесплатно?",
      answer: `Бесплатно: 1 демо-основа без регистрации, затем ${STORY_FREE_TRIAL} текстовые генерации и ${STORY_FREE_PORTRAIT} портрет после входа. Дальше — кредиты от ${formatStoryRub(STORY_GENERATION_PRICE_RUB)}.`
    },
    {
      id: "language",
      question: "На каких языках можно писать?",
      answer:
        "Русский, английский, немецкий, французский и испанский. Тексты генерируются на выбранном языке произведения."
    },
    {
      id: "delete",
      question: "Как удалить ненужную историю?",
      answer: "В кабинете у каждой истории в списке слева есть кнопка удаления."
    }
  ];
}
