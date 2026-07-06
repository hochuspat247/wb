import { ExampleCard } from "@/components/ui/ExampleCard";
import { exampleProducts } from "@/components/ui/ProductPreviewCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ExamplesSection() {
  return (
    <section className="border-y border-clay bg-card py-18 md:py-24" id="examples">
      <div className="section-shell">
        <SectionHeader
          description="Из обычного фото сервис собирает визуал, который можно тестировать в карточке товара."
          title="Не рассказываем про AI — показываем результат"
        />

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
                variant="after"
              />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
