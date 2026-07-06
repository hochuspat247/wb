"use client";

import { useState } from "react";
import { ExampleCard } from "@/components/ui/ExampleCard";
import { exampleProducts } from "@/components/ui/ProductPreviewCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs } from "@/components/ui/Tabs";

export function ExamplesSection() {
  const [view, setView] = useState<"before" | "after">("after");

  return (
    <section className="border-t border-clay bg-paper-alt py-20 md:py-28" id="examples">
      <div className="section-shell">
        <SectionHeader
          description="Покажите не «нейросеть», а результат: готовый визуал, который можно тестировать в карточке товара."
          title="Примеры карточек, которые можно получить из обычного фото"
        />

        <Reveal delay={1}>
          <div className="mt-10 flex justify-center">
            <Tabs
              active={view}
              onChange={(id) => setView(id as "before" | "after")}
              tabs={[
                { id: "before", label: "До" },
                { id: "after", label: "После" }
              ]}
            />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {exampleProducts.map((product, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={product.id}>
              <ExampleCard
                badges={[...product.badges]}
                subtitle={product.subtitle}
                theme={product.theme}
                title={product.title}
                variant={view}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
