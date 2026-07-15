import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { Button } from "@/components/ui/Button";
import type { StoryStudioMarketingPage } from "@/lib/storystudio/marketingPages";
import { absoluteUrl } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

type StoryStudioUseCaseLandingProps = {
  page: StoryStudioMarketingPage;
};

export function StoryStudioUseCaseLanding({ page }: StoryStudioUseCaseLandingProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: absoluteUrl(page.path),
        inLanguage: "ru-RU",
        isPartOf: {
          "@type": "WebSite",
          name: BRAND.storyStudio,
          url: absoluteUrl("/storystudio")
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: BRAND.storyStudio,
            item: absoluteUrl("/storystudio")
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.badge,
            item: absoluteUrl(page.path)
          }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      },
      {
        "@type": "HowTo",
        name: page.h1,
        description: page.lead,
        step: page.workflow.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.text
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen text-ink">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <StoryStudioHeader />

      <main className="relative pt-20 sm:pt-24">
        <section className="mx-auto max-w-content px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
          <Link className="text-sm text-muted transition hover:text-gold" href="/storystudio">
            ← {BRAND.storyStudio}
          </Link>
          <p className="story-fairy-eyebrow mt-6">{page.badge}</p>
          <h1 className="story-fairy-title mt-3 max-w-4xl text-4xl text-moon sm:text-5xl">{page.h1}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{page.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/storystudio/create">
              <Button className="w-full !border-gold !bg-gold !text-[#1a140f] sm:w-auto" size="lg">
                Создать историю
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/storystudio#pricing">
              <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                Тарифы
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-y border-[rgba(212,180,131,0.12)] bg-white/[0.02] py-10 sm:py-14">
          <div className="mx-auto max-w-content px-4 sm:px-6">
            <h2 className="story-fairy-title text-3xl text-moon">Что получает автор</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {page.benefits.map((benefit) => (
                <li className="story-fairy-panel flex items-start gap-3 rounded-card p-4" key={benefit}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} />
                  <span className="text-sm leading-relaxed text-moon">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="story-fairy-title text-3xl text-moon">Как это работает</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {page.workflow.map((step, index) => (
              <li className="story-fairy-panel rounded-card p-5" key={step.title}>
                <span className="story-fairy-eyebrow">Шаг {index + 1}</span>
                <h3 className="mt-3 font-fairy text-xl font-semibold text-moon">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-content px-4 pb-16 sm:px-6 sm:pb-24">
          <h2 className="story-fairy-title text-3xl text-moon">Частые вопросы</h2>
          <div className="mt-8 grid gap-4">
            {page.faq.map((item) => (
              <article className="story-fairy-panel rounded-card p-5" key={item.question}>
                <h3 className="font-fairy text-xl font-semibold text-moon">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="story-fairy-panel mt-10 rounded-container p-6 text-center sm:p-8">
            <h2 className="story-fairy-title text-2xl text-moon sm:text-3xl">
              Попробуйте {BRAND.storyStudio} бесплатно
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
              Создайте основу произведения за пару минут — персонажи, карта связей и главы в одном кабинете.
            </p>
            <Link className="mt-6 inline-block" href="/storystudio/create">
              <Button className="!border-gold !bg-gold !text-[#1a140f]" size="lg">
                Начать сейчас
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <StoryStudioFooter />
    </div>
  );
}
