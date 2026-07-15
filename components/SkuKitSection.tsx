import { ImageIcon, Layers, ListChecks, Sparkles, Target } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  KIT_SERIES_DESCRIPTION,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_SLIDE_COUNT,
  calculatePackagePrice,
  describeFreeQuotaMarketing,
  formatRub
} from "@/lib/pricing";

const kit = calculatePackagePrice(SKU_KIT_SLIDE_COUNT);

const kitItems = [
  {
    icon: ImageIcon,
    title: "Титульная обложка 4:5",
    text: "Главный слайд для листинга на WB, Ozon и Авито."
  },
  {
    icon: Sparkles,
    title: "Преимущества",
    text: "Слайд с ключевыми выгодами товара без выдуманных свойств."
  },
  {
    icon: ListChecks,
    title: "Характеристики",
    text: "Структурированные параметры для карточки."
  },
  {
    icon: Target,
    title: "Сценарий использования",
    text: "Как товар работает в реальной ситуации."
  },
  {
    icon: Layers,
    title: "Рекламный вариант",
    text: "Дополнительный слайд для теста гипотез и продвижения."
  }
] as const;

export function SkuKitSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="sku-kit">
      <div className="section-shell">
        <SectionHeader
          description={`${describeFreeQuotaMarketing()}. Чтобы собрать серию инфографики для одного товара, нужен комплект: ${KIT_SERIES_DESCRIPTION.toLowerCase()} без метки.`}
          title={`Что входит в «${PLAN_SKU_KIT_NAME}»`}
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {kitItems.map((item, index) => (
            <Reveal delay={Math.min(index + 1, 4) as 1 | 2 | 3 | 4} key={item.title}>
              <div className="flex h-full flex-col rounded-[20px] border border-clay bg-card p-5">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <item.icon size={20} />
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Слайд {index + 1}</p>
                <h3 className="mt-2 text-base font-black text-ink">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mt-10 max-w-3xl text-sm font-semibold leading-relaxed text-muted md:text-base">
            Цена комплекта — {formatRub(kit.total)}, разовая оплата без подписки. Внутри тексты, СЕО и скачивание без водяного знака.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
