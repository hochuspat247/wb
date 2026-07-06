import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { AfterCardMock } from "@/components/marketing/ProductMocks";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const benefits = [
  "Название, описание и SEO за один клик",
  "Премиальная AI-обложка из вашего фото",
  "Готово к загрузке на WB, Ozon, Avito"
];

const checklist = ["Заголовок", "Описание", "SEO-ключи", "Обложка 4:5"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-12 pt-8 md:pb-20 md:pt-14">
      <div className="glow-orb -left-32 top-0 h-72 w-72 bg-coral/20" />
      <div className="glow-orb right-0 top-20 h-80 w-80 bg-violet/15" />

      <div className="section-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-coral/15 bg-white/80 px-4 py-2 text-sm font-bold text-coral shadow-soft backdrop-blur-sm">
              <Sparkles size={15} />
              AI для продавцов маркетплейсов
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="text-[2.5rem] font-black leading-[1.05] tracking-tight text-ink md:text-6xl">
              Карточка, которая{" "}
              <span className="gradient-text">продаёт</span>
              <br />
              за 2 минуты
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Загрузите фото — получите премиальный креатив с текстом, SEO и обложкой 4:5 для Wildberries, Ozon и Avito.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <ul className="mt-7 space-y-3">
              {benefits.map((item) => (
                <li className="flex items-center gap-3 text-sm font-semibold text-ink md:text-base" key={item}>
                  <CheckCircle2 className="shrink-0 text-coral" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={4}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/cabinet#create">
                <Button className="w-full px-8 py-3.5 text-base sm:w-auto">
                  Попробовать бесплатно
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link
                className="text-center text-sm font-bold text-muted transition hover:text-ink sm:text-left"
                href="/#cases"
              >
                Смотреть примеры →
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Без карты · 3 карточки бесплатно · Результат можно скачать</p>
            <p className="mt-2 text-xs text-muted/80">Регистрация за 30 секунд · демо-режим, результат можно скачать</p>
          </Reveal>
        </div>

        <Reveal delay={2}>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-coral/15 via-violet/10 to-mint/15 blur-xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-premium">
              <div className="flex items-center justify-between border-b border-ink/5 px-5 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mint/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Превью</span>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.75fr] sm:p-5">
                <div className="overflow-hidden rounded-2xl">
                  <AfterCardMock />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  {checklist.map((item) => (
                    <div
                      className="flex items-center gap-2 rounded-xl border border-ink/6 bg-paper px-3 py-2.5 text-sm font-semibold text-ink"
                      key={item}
                    >
                      <CheckCircle2 className="shrink-0 text-coral" size={14} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-white sm:mx-5 sm:mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Генерация</p>
                  <p className="text-2xl font-black">~ 2 мин</p>
                </div>
                <span className="rounded-xl bg-mint px-4 py-2 text-xs font-black text-ink">Готово</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
