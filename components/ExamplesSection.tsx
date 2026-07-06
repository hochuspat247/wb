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
    <section className="studio-noise relative border-y border-clay bg-paper-alt py-20 md:py-28" id="examples">
      <div className="section-shell">
        <SectionHeader
          description="Из обычного фото сервис собирает готовую карточку, которую можно тестировать на маркетплейсе."
          title="Не обещаем — показываем результат"
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

        <div className="mt-12 grid auto-rows-[minmax(280px,auto)] gap-5 md:grid-cols-4">
          {exampleProducts.map((product, i) => (
            <Reveal
              delay={(i + 1) as 1 | 2 | 3 | 4}
              key={product.id}
            >
              <div className={i === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-1"}>
              <ExampleCard
                badges={[...product.badges]}
                featured={i === 0}
                subtitle={product.subtitle}
                theme={product.theme}
                title={product.title}
                variant={view}
                images={product.images}
              />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
