import { ArrowRight, Camera, FileText, Home, Sparkles, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

const steps: Array<{
  num: string;
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  { num: "01", title: "Фото", text: "3–10 снимков квартиры", icon: Upload },
  { num: "02", title: "Параметры", text: "Комнаты, площадь, цена, район", icon: Home },
  { num: "03", title: "ИИ-анализ", text: "Сильные стороны и лучший кадр", icon: Sparkles },
  { num: "04", title: "Текст", text: "Заголовок, описание, преимущества", icon: FileText },
  { num: "05", title: "Обложка", text: "Продающее первое фото", icon: Camera }
];

export function KvartovidWorkflowSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-10 sm:py-16" id="workflow">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Как работает КвартоВид</h2>
          <p className="mt-3 text-muted">
            От фото квартиры до готового объявления с обложкой — за минуту, без шаблонов и копипаста.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {steps.map((step, index) => (
            <Fragment key={step.num}>
              <div className="group flex flex-1 flex-col rounded-card border border-white/10 bg-card/60 p-5 backdrop-blur-sm transition hover:border-amber-500/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-black text-amber-400">
                    {step.num}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition group-hover:text-amber-400">
                    <step.icon size={16} />
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>

              {index < steps.length - 1 ? (
                <div aria-hidden className="hidden shrink-0 items-center justify-center px-1 lg:flex lg:pt-8">
                  <ArrowRight className="text-amber-500/50" size={18} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
