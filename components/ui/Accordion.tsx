"use client";

import { useState } from "react";

type AccordionItem = {
  id: string;
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            className={`overflow-hidden rounded-[20px] border transition-all duration-300 ${
              isOpen ? "border-ink/15 bg-accent-soft shadow-card" : "border-clay bg-card hover:border-ink/12"
            }`}
            key={item.id}
          >
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              type="button"
            >
              <span className="font-display text-lg font-semibold leading-tight text-ink md:text-xl">
                {item.question}
              </span>
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-lg font-bold transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 border-ink bg-ink text-accent"
                    : "border-clay bg-card text-muted"
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm font-medium leading-relaxed text-muted md:px-6 md:text-base">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
