import { CompareSection } from "@/components/CompareSection";
import { CasesSection } from "@/components/CasesSection";
import { ExamplesSection } from "@/components/ExamplesSection";
import { VideoExampleSection } from "@/components/VideoExampleSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PricingCalculatorSection } from "@/components/PricingCalculatorSection";
import { PricingSection } from "@/components/PricingSection";
import { SkuKitSection } from "@/components/SkuKitSection";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { WildberriesLandingSection } from "@/components/wildberries/WildberriesLandingSection";
import { createPageMetadata } from "@/lib/seo";
import { describeFreeQuotaMarketing, GENERATION_TIME_COPY } from "@/lib/pricing";

export const metadata = createPageMetadata({
  path: "/",
  title: "ИИ-генератор карточек товара для Wildberries, Ozon и Авито",
  description: `Загрузите фото — получите готовый комплект карточек для одного SKU: обложка 4:5, слайды, название, описание и СЕО-ключи. ${GENERATION_TIME_COPY}. ${describeFreeQuotaMarketing()}.`,
  keywords: [
    "генератор карточек товара бесплатно",
    "нейросеть карточка товара wildberries",
    "комплект карточек для одного товара",
    "ии инфографика маркетплейс"
  ]
});

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <HomeJsonLd />
      <Header />
      <Hero />
      <ExamplesSection />
      <SkuKitSection />
      <PricingSection />
      <PricingCalculatorSection />
      <CompareSection />
      <CasesSection />
      <WildberriesLandingSection />
      <VideoExampleSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
