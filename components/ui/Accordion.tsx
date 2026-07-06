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
    <div className="divide-y divide-clay border-y border-clay">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <button
              className="flex w-full items-center justify-between gap-4 py-6 text-left transition hover:px-3"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              type="button"
            >
              <span className="text-xl font-black leading-tight text-ink md:text-2xl">{item.question}</span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay text-muted transition ${
                  isOpen ? "rotate-45 bg-accent text-paper" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen ? (
              <div className="pb-6">
                <p className="max-w-2xl text-base font-medium leading-relaxed text-muted">{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
