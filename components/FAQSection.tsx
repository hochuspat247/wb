import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Accordion } from "@/components/ui/Accordion";

const faq = [
  {
    id: "publish",
    question: "Это уже публикует карточку на WB/Ozon?",
    answer:
      "В текущей версии доступна генерация и экспорт. Прямая публикация через API запланирована в следующих версиях."
  },
  {
    id: "free",
    question: "Можно ли попробовать бесплатно?",
    answer: "Да, можно создать 3 тестовые карточки без карты."
  },
  {
    id: "photo",
    question: "Что происходит с фото товара?",
    answer:
      "Фото используется для генерации карточки и предпросмотра. В MVP результат можно скачать и сохранить в истории."
  },
  {
    id: "designer",
    question: "Нужен ли дизайнер?",
    answer:
      "Для первого варианта карточки — нет. Сервис помогает быстро собрать текст, SEO и обложку, которую можно тестировать."
  },
  {
    id: "ai-image",
    question: "Почему AI-картинка может не сгенерироваться?",
    answer:
      "Генерация изображений зависит от выбранного провайдера и лимитов API. Если она недоступна, сервис покажет fallback-preview."
  }
];

export function FAQSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="faq">
      <div className="section-shell">
        <SectionHeader title="Частые вопросы" />
        <Reveal delay={1}>
          <div className="mx-auto mt-14 max-w-4xl">
            <Accordion items={faq} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
