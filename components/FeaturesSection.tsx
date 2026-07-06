import { Download, Image, Search, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const features = [
  ["Продающие тексты", "Название, описание и преимущества — сразу готовы к публикации.", Sparkles, "from-coral/15 to-coral/5 text-coral"],
  ["SEO под маркетплейс", "Ключевые слова для поиска на WB, Ozon, Avito и Яндекс Маркете.", Search, "from-violet/15 to-violet/5 text-violet"],
  ["Премиум AI-обложка", "AI создаёт дорогой креатив 4:5, сохраняя ваш товар узнаваемым.", Image, "from-sky/15 to-sky/5 text-sky"],
  ["Скачивание в один клик", "PNG-обложка и текст — сразу на площадку.", Download, "from-mint/20 to-mint/5 text-[#7a9e00]"]
] as const;

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28" id="features">
      <div className="section-shell">
        <SectionHeader
          kicker="Возможности"
          title={
            <>
              Всё для первой продажи — <span className="gradient-text">в одном месте</span>
            </>
          }
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {features.map(([title, text, Icon, iconClass], i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3} key={title}>
              <div className="premium-card group h-full rounded-3xl p-7">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${iconClass} transition group-hover:scale-110`}>
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-black text-ink">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
