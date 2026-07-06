import { Reveal } from "@/components/ui/Reveal";

const faq = [
  ["Нужен ли дизайнер?", "Нет. Загрузите фото товара — сервис сам создаст премиальную обложку и тексты."],
  ["Подходит ли для Wildberries и Ozon?", "Да. Карточки адаптированы под требования WB, Ozon, Avito и Яндекс Маркета."],
  ["Можно скачать результат?", "Да. Скачайте PNG-обложку и скопируйте тексты — сразу на площадку."],
  ["Где хранятся мои карточки?", "В личном кабинете — все сохранённые карточки доступны в один клик."],
  ["Что если результат не понравится?", "Перегенерируйте с другим стилем. Первые попытки бесплатны."]
];

export function FAQSection() {
  return (
    <section className="py-24" id="faq">
      <div className="section-shell">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-kicker">Вопросы</span>
            <h2 className="mt-5 text-3xl font-black leading-tight text-ink md:text-5xl">Частые вопросы</h2>
          </div>
        </Reveal>
        <div className="mx-auto mt-14 max-w-2xl">
          {faq.map(([question, answer], i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={question}>
              <details className="group premium-card mb-3 rounded-2xl px-6 py-1">
                <summary className="cursor-pointer list-none py-5 text-lg font-bold text-ink marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {question}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-muted transition group-open:rotate-45 group-open:bg-coral/10 group-open:text-coral">
                      +
                    </span>
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed text-muted">{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
