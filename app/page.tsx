import { AudienceSection } from "@/components/AudienceSection";
import { CompareSection } from "@/components/CompareSection";
import { ExamplesSection } from "@/components/ExamplesSection";
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
import { TrustBar } from "@/components/TrustBar";
import { WorkflowSection } from "@/components/WorkflowSection";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  title: "Генератор карточек товаров для маркетплейсов",
  description:
    "Создайте карточку для Wildberries, Ozon, Avito и Яндекс Маркета: тексты под площадку, SEO, инфографика и AI-обложка по фото товара."
});

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <HomeJsonLd />
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
      <PricingCalculatorSection />
      <TestimonialsSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
