"use client";

import { useEffect, useState } from "react";
import { HeroBeforeAfterPreview } from "@/components/hero/HeroBeforeAfterPreview";
import { HeroMiniGenerator } from "@/components/hero/HeroMiniGenerator";
import { HeroActions } from "@/components/HeroActions";
import { HeroViewTracker } from "@/components/hero/HeroViewTracker";
import { Reveal } from "@/components/ui/Reveal";

const PROGRESS_STEPS = ["Фото", "Генерация", "Проверка", "Скачать"] as const;

export function Hero() {
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setProgressReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="hero-wow anchor-section relative overflow-hidden pb-8 pt-8 md:pb-12 md:pt-12" id="hero">
      <HeroViewTracker />

      <div className="hero-wow-blobs" aria-hidden>
        <div className="hero-wow-blob hero-wow-blob--lime" />
        <div className="hero-wow-blob hero-wow-blob--lime-2" />
        <div className="hero-wow-blob hero-wow-blob--pink" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-12">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <Reveal delay={1} immediate>
              <h1 className="hero-title mt-0 max-w-[16ch] text-balance text-[2rem] font-semibold leading-[1.06] text-ink sm:text-[2.55rem] md:text-[3.15rem] lg:text-[3.4rem]">
                Карточки для ВБ, Озон и Авито{" "}
                <span className="hero-title-accent">за 1–2 минуты</span>
              </h1>
            </Reveal>

            <Reveal delay={2} immediate>
              <p className="hero-lead mt-5 max-w-[34rem] text-[1.05rem] font-medium leading-[1.75] text-muted sm:mt-6 sm:text-lg md:text-[1.12rem]">
                Загрузите фото — ИИ создаст обложку 4:5, описание и СЕО-ключи. После проверки результата можно заказать
                комплект: обложку и четыре дополнительных слайда.
              </p>
            </Reveal>

            <Reveal className="mt-8 w-full max-w-lg sm:mt-9" delay={2} immediate>
              <div className={`hero-progress-anim ${progressReady ? "is-ready" : ""}`}>
                <div className="relative w-full">
                  <div
                    aria-hidden
                    className="absolute left-[12.5%] right-[12.5%] top-[9px] h-[3px] overflow-hidden rounded-full bg-ink/[0.08] sm:top-[10px]"
                  >
                    <div className="hero-progress-fill h-full rounded-full bg-gradient-to-r from-[#C8F85A] via-accent to-[#ADFC00]" />
                  </div>

                  <ol className="relative grid grid-cols-4">
                    {PROGRESS_STEPS.map((step, index) => (
                      <li
                        className="hero-progress-step flex flex-col items-center gap-3 sm:gap-3.5"
                        key={step}
                        style={{ transitionDelay: `${160 + index * 160}ms` }}
                      >
                        <span className="hero-progress-dot relative z-[1] grid h-[20px] w-[20px] place-items-center rounded-full border border-ink/15 bg-card sm:h-[22px] sm:w-[22px]">
                          <span className="hero-progress-dot-core h-2 w-2 rounded-full bg-ink sm:h-2.5 sm:w-2.5" />
                        </span>
                        <span className="hero-progress-label text-center text-[11px] font-medium tracking-[0.02em] text-muted sm:text-[13px]">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Reveal>

            <Reveal className="mt-8 sm:mt-9" delay={3} immediate>
              <HeroActions />
            </Reveal>
          </div>

          <Reveal className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2" delay={2} immediate variant="left">
            <div className="wow-card rounded-[28px] border border-clay/80 bg-card/90 p-1 shadow-card backdrop-blur-sm">
              <HeroMiniGenerator />
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-8 md:mt-10" delay={4}>
          <HeroBeforeAfterPreview />
        </Reveal>
      </div>
    </section>
  );
}
