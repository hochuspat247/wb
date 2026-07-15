import { ChevronRight, Download, FileText, ImageIcon, Search, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps: Array<{
  num: string;
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    num: "01",
    title: "Фото",
    text: "Загрузка исходника",
    icon: Upload
  },
  {
    num: "02",
    title: "Описание",
    text: "Смысл и оффер",
    icon: FileText
  },
  {
    num: "03",
    title: "SEO",
    text: "Ключи и структура",
    icon: Search
  },
  {
    num: "04",
    title: "Обложка",
    text: "Креатив 4:5",
    icon: ImageIcon
  },
  {
    num: "05",
    title: "Экспорт",
    text: "PNG и JSON",
    icon: Download
  }
];

export function WorkflowSection() {
  return (
    <section className="py-20 md:py-28" id="workflow">
      <div className="section-shell">
        <SectionHeader
          description="Фото → описание → СЕО → обложка → экспорт → видео из карточки. Вся логика собрана в один продуктовый сценарий."
          title="Процесс виден как pipeline, а не спрятан в форме"
        />

        <div className="mt-14 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {steps.map((step, i) => (
            <Fragment key={step.num}>
              <Reveal className="flex-1" delay={(Math.min(i, 3) + 1) as 1 | 2 | 3 | 4}>
                <div className="group flex h-full flex-col rounded-[22px] border border-clay bg-gradient-to-b from-white/[0.05] to-transparent p-5 transition duration-300 hover:border-accent/25 hover:from-accent/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/30 bg-paper text-[11px] font-black text-accent-ink">
                      {step.num}
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-clay bg-card/80 text-muted transition group-hover:border-accent/20 group-hover:text-accent-ink">
                      <step.icon size={16} />
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{step.text}</p>
                </div>
              </Reveal>

              {i < steps.length - 1 ? (
                <div
                  aria-hidden
                  className="hidden shrink-0 items-center justify-center px-1 lg:flex lg:pt-8"
                >
                  <ChevronRight className="text-accent-ink/45" size={18} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
