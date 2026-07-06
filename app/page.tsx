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
import { TrustBar } from "@/components/TrustBar";
import { WorkflowSection } from "@/components/WorkflowSection";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Header />
      <Hero />
      <TrustBar />
      <ExamplesSection />

      <section className="py-16 md:py-24" id="demo">
        <div className="section-shell">
          <div className="studio-noise relative overflow-hidden rounded-container border border-clay bg-card p-5 shadow-soft md:p-10">
            <SectionHeader
              align="left"
              description="Введите товар, выберите стиль и получите текст, SEO и визуал в одном рабочем процессе."
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

      <PainSection />
      <WorkflowSection />
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
