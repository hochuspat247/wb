"use client";

import { ExampleCard } from "@/components/ui/ExampleCard";
import { exampleProducts } from "@/components/ui/ProductPreviewCard";
import { Card } from "@/components/ui/Card";

export function CabinetExamplesSection() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card padding="lg">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Галерея</p>
        <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Примеры карточек</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
          Потяните ползунок на карточке — сравните исходное фото и готовую обложку для маркетплейса. Все примеры
          сгенерированы в {` `}
          <span className="text-ink">МаркетКард ИИ</span>.
        </p>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {exampleProducts.map((product) => (
          <div className="space-y-3" key={product.id}>
            <ExampleCard
              badges={[...product.badges]}
              compareLabel={product.compareLabel}
              duration={product.duration}
              images={product.images}
              subtitle={product.subtitle}
              theme={product.theme}
              title={product.title}
              variant="after"
            />
            <div className="px-1">
              <p className="text-sm font-black text-ink">{product.title}</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {product.subtitle}
                {product.duration ? ` · ${product.duration}` : ""}
                {product.compareLabel ? ` · ${product.compareLabel}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
