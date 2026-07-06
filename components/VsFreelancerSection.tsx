import { Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const freelancerCons = [
  ["300 — 1 500 ₽ за карточку", "Цена зависит от настроения и загрузки"],
  ["1 — 3 дня ожидания", "Очередь, правки, согласования"],
  ["Правки за доплату", "Каждая итерация — время и деньги"],
  ["Часто используют AI", "Генерируют то же самое и перепродают"],
  ["Непредсказуемое качество", "Зависит от навыков исполнителя"]
];

const ourPros = [
  ["от 0 ₽ за карточку", "3 бесплатно, далее — фиксированный тариф"],
  ["~ 2 минуты", "Результат мгновенно, без очередей"],
  ["Перегенерация бесплатно", "Не понравился стиль — создайте снова"],
  ["Тот же AI, но напрямую", "Без наценки посредника"],
  ["Стабильный премиум-уровень", "Промпты написаны профессионалами"]
];

export function VsFreelancerSection() {
  return (
    <section className="dark-section-inner border-t border-white/6 py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          description="Фрилансеры на биржах давно генерируют карточки нейросетью и перепродают. Мы даём тот же инструмент — напрямую."
          theme="dark"
          title={
            <>
              MarketCard AI <span className="text-white/35">против</span>{" "}
              <span className="gradient-text-light">фрилансера</span>
            </>
          }
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <Reveal delay={1}>
            <div className="compare-card compare-card-negative flex h-full flex-col rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white md:text-2xl">Фрилансер</h3>
                <span className="badge-negative">Дорого и долго</span>
              </div>
              <ul className="mt-6 flex-1 space-y-0">
                {freelancerCons.map(([title, sub]) => (
                  <li className="compare-row" key={title}>
                    <span className="icon-negative">
                      <X size={14} strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-sm text-white/40">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="compare-card compare-card-positive flex h-full flex-col rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white md:text-2xl">
                  MarketCard <span className="text-mint">AI</span>
                </h3>
                <span className="badge-positive">Быстро и выгодно</span>
              </div>
              <ul className="mt-6 flex-1 space-y-0">
                {ourPros.map(([title, sub]) => (
                  <li className="compare-row" key={title}>
                    <span className="icon-positive">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-sm text-white/40">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link className="mt-8 block" href="/cabinet#create">
                <Button className="w-full bg-mint py-3.5 text-base font-black text-ink hover:bg-[#c8ef3a]">
                  Попробовать бесплатно
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
