"use client";

import { useState } from "react";
import { getStoryStudioFaqItems } from "@/lib/storystudio/marketingFaq";
import { BRAND } from "@/lib/branding";

const faq = getStoryStudioFaqItems();

export function StoryStudioFaqSection() {
  const [openId, setOpenId] = useState<string | null>(faq[0]?.id ?? null);

  return (
    <section id="faq" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
      <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
      <p className="mb-10 text-center text-muted">Всё про {BRAND.storyStudio}, карту связей и видео-серии</p>

      <div className="mx-auto max-w-3xl divide-y divide-white/10 rounded-card border border-white/10 bg-card/40">
        {faq.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id} className="px-4 sm:px-5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 py-4 text-left sm:gap-4 sm:py-5"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-ink sm:text-base lg:text-lg">{item.question}</span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-muted transition ${
                    isOpen ? "rotate-45 bg-violet text-white" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p className="pb-5 text-sm leading-relaxed text-muted sm:text-base">{item.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
