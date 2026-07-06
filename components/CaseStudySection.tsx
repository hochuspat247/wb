"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowRight, GripVertical } from "lucide-react";
import Link from "next/link";
import { CaseAfterMock, CaseBeforeMock, categoryToVariant } from "@/components/marketing/ProductMocks";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const categories = ["Одежда", "Обувь", "Косметика", "Мебель", "Электроника", "Аксессуары"] as const;

type Category = (typeof categories)[number];

const cases: Record<
  Category,
  {
    label: string;
    title: string;
    description: string;
    stats: { saved: string; budget: string; assets: string; variants: string };
  }
> = {
  Одежда: {
    label: "Кейс · Одежда",
    title: "Полосатый джемпер-поло",
    description: "Одно фото с телефона — и готовый lifestyle-кадр для карточки. Без студии, без модели, без ретушёра.",
    stats: { saved: "12 дней", budget: "30 000 ₽", assets: "12", variants: "∞" }
  },
  Обувь: {
    label: "Кейс · Обувь",
    title: "Кроссовки премиум-класса",
    description: "Фото на полу превращается в динамичный креатив с акцентом на подошву и материал.",
    stats: { saved: "8 дней", budget: "18 000 ₽", assets: "8", variants: "∞" }
  },
  Косметика: {
    label: "Кейс · Косметика",
    title: "Сыворотка для лица",
    description: "Белый фон и баночка — AI добавляет премиальную подачу, текстуры и инфографику.",
    stats: { saved: "5 дней", budget: "12 000 ₽", assets: "6", variants: "∞" }
  },
  Мебель: {
    label: "Кейс · Мебель",
    title: "Прикроватная тумба",
    description: "Товар в гараже — на выходе интерьерная сцена с правильным светом и масштабом.",
    stats: { saved: "10 дней", budget: "25 000 ₽", assets: "10", variants: "∞" }
  },
  Электроника: {
    label: "Кейс · Электроника",
    title: "TDS-метр для воды",
    description: "Простое фото на чёрном фоне — премиальная инфографика с характеристиками и иконками.",
    stats: { saved: "6 дней", budget: "15 000 ₽", assets: "5", variants: "∞" }
  },
  Аксессуары: {
    label: "Кейс · Аксессуары",
    title: "Кожаный ремень",
    description: "Макро-фото фактуры — AI собирает каталожную карточку с деталями и преимуществами.",
    stats: { saved: "4 дня", budget: "9 000 ₽", assets: "4", variants: "∞" }
  }
};

export function CaseStudySection() {
  const [active, setActive] = useState<Category>("Одежда");
  const [slider, setSlider] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = cases[active];
  const variant = categoryToVariant[active];

  const updateSlider = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSlider(Math.min(90, Math.max(10, pct)));
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    updateSlider(e.clientX);
  }

  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <section className="dark-section-inner border-t border-white/6 py-20 md:py-28" id="cases">
      <div className="section-shell">
        <SectionHeader
          kicker="Кейсы"
          theme="dark"
          title={
            <>
              Реальные примеры <span className="gradient-text-light">по категориям</span>
            </>
          }
        />

        <Reveal delay={1}>
          <div className="category-tabs mt-10">
            {categories.map((cat) => (
              <button
                className={`category-tab ${active === cat ? "category-tab-active" : ""}`}
                key={cat}
                onClick={() => {
                  setActive(cat);
                  setSlider(50);
                }}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <Reveal delay={2}>
            <div
              className="case-slider relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#12121a] shadow-premium select-none lg:max-w-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerUp}
              onPointerUp={onPointerUp}
              ref={containerRef}
            >
              <div className="absolute inset-0">
                <CaseAfterMock variant={variant} />
              </div>

              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                <CaseBeforeMock variant={variant} />
              </div>

              <span className="absolute left-4 top-4 z-20 rounded-lg bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur-md">
                До
              </span>
              <span className="absolute right-4 top-4 z-20 rounded-lg bg-mint/90 px-3 py-1.5 text-[11px] font-black text-ink">
                После
              </span>

              <div
                className="absolute inset-y-0 z-30 w-0.5 bg-mint shadow-[0_0_24px_#d8ff45]"
                style={{ left: `${slider}%` }}
              >
                <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-mint bg-ink text-mint">
                  <GripVertical size={16} />
                </div>
              </div>

              <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur-md">
                Потяните для сравнения
              </p>
            </div>
          </Reveal>

          <Reveal delay={3}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-mint">{current.label}</p>
              <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">{current.title}</h3>
              <p className="mt-4 leading-relaxed text-white/55">{current.description}</p>

              <div className="stat-grid mt-8">
                {[
                  ["Сэкономлено времени", current.stats.saved],
                  ["Сэкономлено бюджета", current.stats.budget],
                  ["Ассетов сгенерировано", current.stats.assets],
                  ["Вариантов на SKU", current.stats.variants]
                ].map(([label, value]) => (
                  <div className="stat-cell" key={label}>
                    <p className="text-xs font-medium text-white/40">{label}</p>
                    <p className="mt-1.5 text-2xl font-black text-mint">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cabinet#create">
                  <Button className="bg-mint px-6 py-3.5 font-black text-ink hover:bg-[#c8ef3a]">
                    Попробовать со своим товаром
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/#how">
                  <Button className="border border-white/15 bg-transparent text-white/80 hover:bg-white/5" variant="ghost">
                    Как это работает
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
