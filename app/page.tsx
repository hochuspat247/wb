import { CompareSection } from "@/components/CompareSection";
import { CasesSection } from "@/components/CasesSection";
import { ExamplesSection } from "@/components/ExamplesSection";
import { VideoExampleSection } from "@/components/VideoExampleSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StatsStrip } from "@/components/StatsStrip";
import { BenefitsGrid } from "@/components/BenefitsGrid";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { FinalCtaBanner } from "@/components/FinalCtaBanner";
import { PricingCalculatorSection } from "@/components/PricingCalculatorSection";
import { PricingSection } from "@/components/PricingSection";
import { SkuKitSection } from "@/components/SkuKitSection";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { WildberriesLandingSection } from "@/components/wildberries/WildberriesLandingSection";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  documentTitle: "ИИ-генератор карточек для маркетплейсов — МаркетКард",
  description:
    "Создайте карточку товара для Wildberries, Ozon и Авито по фото за 1–2 минуты. Обложка, инфографика и SEO-текст. 2 пробные карточки.",
  keywords: [
    "генератор карточек товара бесплатно",
    "нейросеть карточка товара wildberries",
    "карточка товара по фото",
    "инфографика для маркетплейсов"
  ]
});

/** Homepage is mostly marketing UI — refresh at most hourly to keep TTFB stable. */
export const revalidate = 3600;

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <HomeJsonLd />
      <Header />
      <Hero />
      <StatsStrip />
      <BenefitsGrid />
      <HowItWorksSteps />
      <ExamplesSection />
      <SkuKitSection />
      <PricingSection />
      <PricingCalculatorSection />
      <CompareSection />
      <CasesSection />
      <WildberriesLandingSection />
      <VideoExampleSection />
      <FAQSection />
      <FinalCtaBanner />
      <Footer />
    </main>
  );
}
