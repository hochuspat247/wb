import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { getMarketingFaqItems } from "@/lib/marketing/faq";
import { BRAND } from "@/lib/branding";

const faq = getMarketingFaqItems();

export function FAQSection() {
  return (
    <section className="wow-section-glow border-t border-clay bg-paper py-20 md:py-28" id="faq">
      <div className="section-shell">
        <SectionHeader
          description="Всё, что важно знать перед запуском первой карточки."
          title="Ответы на популярные вопросы"
        />

        <div className="mt-14 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
          <Reveal delay={1} variant="right">
            <Accordion items={faq} />
          </Reveal>

          <Reveal delay={2} variant="left">
            <aside className="wow-card wow-promo-green relative overflow-hidden rounded-[24px] border border-clay/70 p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-8 h-40 w-48 animate-float rounded-full bg-accent/60 blur-2xl"
              />
              <div className="relative z-10">
                <h3 className="font-display text-2xl font-semibold leading-tight text-ink md:text-3xl">
                  Остались вопросы?
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
                  Напишите в поддержку — поможем с демо, комплектом или публикацией на Wildberries.
                </p>
                <a className="mt-6 block" href="mailto:avenir.team.corp@gmail.com">
                  <Button className="w-full" type="button" variant="dark">
                    Написать в поддержку
                  </Button>
                </a>
                <p className="mt-4 text-xs font-semibold text-muted">{BRAND.marketCard}</p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
