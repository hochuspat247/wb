import { CaseStudySection } from "@/components/CaseStudySection";
import { FAQSection } from "@/components/FAQSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PainSection } from "@/components/PainSection";
import { PricingSection } from "@/components/PricingSection";
import { ResultShowcase } from "@/components/ResultShowcase";
import { SocialProof } from "@/components/SocialProof";
import { VsFreelancerSection } from "@/components/VsFreelancerSection";

export default function Home() {
  return (
    <main className="mesh-page relative">
      <Header />
      <Hero />
      <SocialProof />

      <div className="dark-band">
        <ResultShowcase />
        <VsFreelancerSection />
        <CaseStudySection />
      </div>

      <PainSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FinalCta />
      <Footer />
    </main>
  );
}
