import { CompareSection } from "@/components/CompareSection";
import { ExamplesSection } from "@/components/ExamplesSection";
import { VideoExampleSection } from "@/components/VideoExampleSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PainSection } from "@/components/PainSection";
import { PricingCalculatorSection } from "@/components/PricingCalculatorSection";
import { PricingSection } from "@/components/PricingSection";
import { RoadmapSection } from "@/components/RoadmapSection";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { createPageMetadata, siteConfig } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  title: "Генератор карточек и видео для маркетплейсов",
  description: siteConfig.description
});

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <HomeJsonLd />
      <Header />
      <Hero />
      <ExamplesSection />
      <VideoExampleSection />

      <PainSection />
      <CompareSection />
      <HowItWorks />
      <PricingSection />
      <PricingCalculatorSection />
      <TestimonialsSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
