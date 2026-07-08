import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Accordion } from "@/components/ui/Accordion";
import { getMarketingFaqItems } from "@/lib/marketing/faq";

const faq = getMarketingFaqItems();

export function FAQSection() {
  return (
    <section className="border-t border-clay bg-paper py-20 md:py-28" id="faq">
      <div className="section-shell">
        <SectionHeader title="Частые вопросы" />
        <Reveal delay={1}>
          <div className="mx-auto mt-14 max-w-4xl">
            <Accordion items={faq} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
