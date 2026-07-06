import { AudienceSection } from "@/components/AudienceSection";
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
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { TrustBar } from "@/components/TrustBar";
import { WorkflowSection } from "@/components/WorkflowSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Header />
      <Hero />
      <TrustBar />
      <ExamplesSection />

      <PainSection />
      <WorkflowSection />
      <CompareSection />
      <HowItWorks />
      <AudienceSection />
      <PricingSection />
      <TestimonialsSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
