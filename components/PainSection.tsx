import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const pains = [
  {
    title: "Карточка не попадает в поиск",
    text: "Покупатели не находят товар — продажи стоят.",
    emoji: "🔍"
  },
  {
    title: "Часы на тексты и дизайн",
    text: "Вместо продаж вы пишете описания и ищете дизайнера.",
    emoji: "⏳"
  },
  {
    title: "Фото есть, витрины нет",
    text: "Товар снят, а продающей обложки для маркетплейса — нет.",
    emoji: "📸"
  }
];

export function PainSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          kicker="Знакомо?"
          title="Продавать сложно, когда карточка не готова"
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {pains.map((pain, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={pain.title}>
              <div className="premium-card group h-full rounded-3xl p-7">
                <span className="text-3xl">{pain.emoji}</span>
                <h3 className="mt-4 text-xl font-black text-ink">{pain.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{pain.text}</p>
                <div className="mt-5 h-1 w-0 rounded-full bg-gradient-to-r from-coral to-violet transition-all duration-500 group-hover:w-12" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
