import { CompareSection } from "@/components/CompareSection";
import { ExamplesSection } from "@/components/ExamplesSection";
import { VideoExampleSection } from "@/components/VideoExampleSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PainSection } from "@/components/PainSection";
import { PricingCalculatorSection } from "@/components/PricingCalculatorSection";
import { PricingSection } from "@/components/PricingSection";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { WildberriesLandingSection } from "@/components/wildberries/WildberriesLandingSection";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/",
  title: "ИИ-генератор карточек товара для Wildberries, Ozon и Авито",
  description:
    "Загрузите фото — получите обложку 4:5, название, описание и СЕО-ключи для ВБ, Озон и Авито за минуту. Публикация на Wildberries через API, карусель слайдов, видео из карточки. 1 демо без входа + 3 карточки каждый месяц бесплатно.",
  keywords: [
    "генератор карточек товара бесплатно",
    "нейросеть карточка товара wildberries",
    "создать карточку товара за минуту",
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
      <VideoExampleSection />

      <PainSection />
      <CompareSection />
      <WildberriesLandingSection />
      <PricingSection />
      <PricingCalculatorSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
