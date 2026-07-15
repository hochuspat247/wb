import { Clock3, Download, Layers3, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/branding";
import { FREE_DEMO_CARDS, GENERATION_TIME_COPY, describeFreeQuotaMarketing } from "@/lib/pricing";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Без выдуманных свойств",
    text: "Тексты и слайды опираются на ваше фото и описание — без накруток и фантазий о товаре.",
    tone: "green" as const
  },
  {
    icon: Clock3,
    title: "Срочный запуск",
    text: GENERATION_TIME_COPY,
    tone: "cream" as const
  },
  {
    icon: Sparkles,
    title: "ИИ-обложка 4:5",
    text: `${BRAND.marketCard} собирает пресет под маркетплейс и готовит визуал под листинг.`,
    tone: "pink" as const
  },
  {
    icon: Store,
    title: "Три площадки",
    text: "WB, Ozon и Авито — один поток: обложка, описание и СЕО-ключи.",
    tone: "cream" as const
  },
  {
    icon: Download,
    title: "Скачивание и история",
    text: "Готовые слайды в кабинете: повторная генерация, экспорт и публикация на ВБ через API.",
    tone: "green" as const
  },
  {
    icon: Layers3,
    title: `Старт от ${FREE_DEMO_CARDS} демо`,
    text: describeFreeQuotaMarketing(),
    tone: "pink" as const
  }
] as const;

const toneClass = {
  green: "wow-promo-green",
  pink: "wow-promo-pink",
  cream: "wow-promo-cream"
};

export function BenefitsGrid() {
  return (
    <section className="bg-paper py-20 md:py-28" id="benefits">
      <div className="section-shell">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.75rem]">
              Карточки для маркетплейсов — быстро, прозрачно и без лишней ручной работы
            </h2>
            <p className="mt-4 text-base font-medium text-muted md:text-lg">
              Загрузили фото — получили обложку и тексты. Дальше решаете: оставить демо или купить комплект без метки.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item, index) => (
            <Reveal delay={Math.min(index + 1, 4) as 1 | 2 | 3 | 4} key={item.title} variant="scale">
              <article
                className={`wow-card flex h-full flex-col rounded-[24px] border border-clay/70 p-6 md:p-7 ${toneClass[item.tone]}`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-accent">
                  <item.icon size={22} />
                </div>
                <h3 className="font-display mt-5 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-muted">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
