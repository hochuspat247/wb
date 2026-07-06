import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    step: "01",
    title: "Загрузите фото",
    text: "Добавьте снимок товара и пару слов о нём.",
    accent: "bg-coral/10 text-coral"
  },
  {
    step: "02",
    title: "Выберите стиль",
    text: "Укажите маркетплейс и премиум-пресет дизайна.",
    accent: "bg-violet/10 text-violet"
  },
  {
    step: "03",
    title: "Скачайте и публикуйте",
    text: "Получите текст, SEO и обложку — загрузите на площадку.",
    accent: "bg-mint/25 text-[#5a7a00]"
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28" id="how">
      <div className="section-shell">
        <SectionHeader
          description="Весь процесс — в личном кабинете. Первые 3 карточки бесплатно, без привязки карты."
          kicker="Как это работает"
          title={
            <>
              Три шага — <span className="gradient-text">и карточка готова</span>
            </>
          }
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((item, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={item.step}>
              <div className="premium-card group h-full rounded-3xl p-7">
                <span className={`inline-flex rounded-xl px-3.5 py-1.5 text-sm font-black ${item.accent}`}>
                  {item.step}
                </span>
                <h3 className="mt-5 text-xl font-black text-ink">{item.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{item.text}</p>
                <div className="mt-6 h-0.5 w-0 rounded-full bg-gradient-to-r from-coral to-violet transition-all duration-500 group-hover:w-12" />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={3}>
          <p className="mt-10 text-center">
            <Link className="text-sm font-bold text-coral transition hover:text-violet" href="/cabinet#create">
              Перейти в кабинет и создать карточку →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
