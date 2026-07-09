import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    num: "01",
    title: "Загрузите фото товара",
    text: "Добавьте снимок или рендер — этого достаточно для старта."
  },
  {
    num: "02",
    title: "Опишите товар обычным языком",
    text: "Напишите, что это за товар и чем он полезен покупателю."
  },
  {
    num: "03",
    title: "Выберите маркетплейс и стиль",
    text: "WB, Ozon, Avito — сервис адаптирует подачу под площадку."
  },
  {
    num: "04",
    title: "Получите текст, СЕО и обложку",
    text: "Название, описание, ключи и визуал 4:5 в одном результате."
  },
  {
    num: "05",
    title: "Скачайте результат или сохраните в историю",
    text: "Экспортируйте PNG и JSON или вернитесь к варианту позже."
  },
  {
    num: "06",
    title: "Опционально: видео из карточки",
    text: "В кабинете можно оживить готовую обложку в короткий ролик без звука — отдельная оплата после карточки."
  }
];

export function HowItWorks() {
  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28" id="how">
      <div className="section-shell">
        <SectionHeader
          description="Весь процесс укладывается в один сценарий — от фото до карточки и видео из неё."
          title="От фото до готовой карточки и видео"
        />

        <div className="timeline-horizontal mt-14">
          {steps.map((step, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={step.num}>
              <div className="timeline-step px-2 md:px-4">
                <div className="relative">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-clay bg-card text-xs font-bold text-ink">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-ink md:text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
