import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

const audiences = [
  "Селлеры WB и Ozon",
  "Менеджеры маркетплейсов",
  "Небольшие бренды",
  "Агентства по карточкам товаров",
  "Производители и поставщики",
  "Студенты и стартап-команды для теста гипотез"
];

export function AudienceSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader title="Подходит тем, кто часто запускает товары" />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((item, i) => (
            <Reveal delay={(i + 1) as 1 | 2 | 3 | 4} key={item}>
              <Card className="h-full" hover padding="md">
                <p className="font-semibold text-ink">{item}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
