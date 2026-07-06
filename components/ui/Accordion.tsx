"use client";

import { useState, type ReactNode } from "react";

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
    <div className="divide-y divide-clay rounded-card border border-clay bg-card">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <button
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-paper/50"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              type="button"
            >
              <span className="text-base font-semibold text-ink md:text-lg">{item.question}</span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay text-muted transition ${
                  isOpen ? "rotate-45 bg-paper" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen ? (
              <div className="px-6 pb-5">
                <p className="leading-relaxed text-muted">{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
