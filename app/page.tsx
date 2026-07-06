import { AudienceSection } from "@/components/AudienceSection";
import { CardGenerator } from "@/components/CardGenerator";
import { CompareSection } from "@/components/CompareSection";
import { ExamplesSection } from "@/components/ExamplesSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PainSection } from "@/components/PainSection";
import { PricingSection } from "@/components/PricingSection";
import { RoadmapSection } from "@/components/RoadmapSection";
import { WorkflowSection } from "@/components/WorkflowSection";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Header />
      <Hero />
      <PainSection />
      <WorkflowSection />
      <ExamplesSection />

      <section className="py-20 md:py-28" id="demo">
        <div className="section-shell">
          <div className="rounded-container border border-clay bg-ink p-6 md:p-10">
            <SectionHeader
              align="left"
              description="Введите описание товара, выберите стиль и получите текст, SEO и визуал."
              theme="dark"
              title="Соберите первую карточку прямо сейчас"
            />
            <Reveal delay={1}>
              <div className="mt-10">
                <CardGenerator embedded darkConsole />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CompareSection />
      <HowItWorks />
      <AudienceSection />
      <PricingSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
