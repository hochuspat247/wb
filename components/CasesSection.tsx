import Image, { type StaticImageData } from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GENERATION_TIME_COPY } from "@/lib/pricing";
import waterTesterBefore from "@/publick/92ceafd3-6bf3-4fa3-9442-27cdd6cc0038.png";
import waterTesterAfter from "@/publick/bdc93c3d-6c98-45de-bd5f-58f0e4618213.png";
import faceCreamBefore from "@/publick/f0081719-2140-4122-9896-3ad207466049.png";
import faceCreamAfter from "@/publick/8270a01e-bd48-4474-b18d-1a3b6eb2e6fc.png";
import steamerBefore from "@/publick/2f992b7f-7f3c-4871-95b5-252897d799cc.png";
import steamerAfter from "@/publick/b96119e8-f03b-43dc-8f66-c52a0b4ed245.png";

type CaseItem = {
  id: string;
  category: string;
  title: string;
  before: StaticImageData;
  after: StaticImageData;
  note: string;
};

const cases: CaseItem[] = [
  {
    id: "water-tester",
    category: "TDS-метр",
    title: "Тестер качества воды",
    before: waterTesterBefore,
    after: waterTesterAfter,
    note: "Новая обложка"
  },
  {
    id: "face-cream",
    category: "Уход",
    title: "Крем для лица",
    before: faceCreamBefore,
    after: faceCreamAfter,
    note: "Замена окружения"
  },
  {
    id: "steamer",
    category: "Дом",
    title: "Пароочиститель",
    before: steamerBefore,
    after: steamerAfter,
    note: "Замена ракурса"
  }
];

export function CasesSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="cases">
      <div className="section-shell">
        <SectionHeader
          description="Мини-кейсы по реальным товарам из демо: исходное фото → готовый слайд. Без обещаний роста CTR и продаж — только то, что видно на экране."
          title="Примеры комплектов по категориям"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {cases.map((item, index) => (
            <Reveal delay={(index + 1) as 1 | 2 | 3} key={item.id} variant="scale">
              <article className="wow-card overflow-hidden rounded-[24px] border border-clay bg-card">
                <div className="grid grid-cols-2 gap-px bg-clay">
                  <div className="relative aspect-[4/5] bg-paper">
                    <Image
                      alt={`Исходное фото: ${item.title}`}
                      className="object-cover"
                      fill
                      sizes="(max-width:1024px) 50vw, 16vw"
                      src={item.before}
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-clay bg-card/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                      Было
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] bg-paper">
                    <Image
                      alt={`Результат: ${item.title}`}
                      className="object-cover"
                      fill
                      sizes="(max-width:1024px) 50vw, 16vw"
                      src={item.after}
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                      Стало
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">{item.category}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium text-muted">{item.note}</p>
                  <p className="mt-3 text-xs font-semibold text-muted">{GENERATION_TIME_COPY}.</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mt-10 max-w-3xl text-sm font-medium leading-relaxed text-muted">
            Собираем отзывы первых селлеров со ссылкой на карточку на маркетплейсе. Если уже публиковали результат из
            МаркетКард — напишите в поддержку: добавим ваш кейс с фото до/после.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
