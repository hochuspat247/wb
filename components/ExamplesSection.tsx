import { ExampleCard } from "@/components/ui/ExampleCard";
import { exampleProducts } from "@/components/ui/ProductPreviewCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const showcaseProducts = exampleProducts.slice(0, 4);

export function ExamplesSection() {
  return (
    <section className="studio-noise relative border-y border-clay bg-paper-alt py-20 md:py-28" id="examples">
      <div className="section-shell">
        <SectionHeader
          description="Потяните ползунок на карточке — сравните исходное фото и готовую обложку для маркетплейса."
          title="Не обещаем — показываем результат"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {showcaseProducts.map((product, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={product.id}>
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
