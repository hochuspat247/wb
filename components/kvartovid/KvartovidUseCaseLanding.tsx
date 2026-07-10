import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { KvartovidFooter } from "@/components/kvartovid/KvartovidFooter";
import { KvartovidHeader } from "@/components/kvartovid/KvartovidHeader";
import { Button } from "@/components/ui/Button";
import type { KvartovidMarketingPage } from "@/lib/kvartovid/marketingPages";
import { BRAND } from "@/lib/branding";

type KvartovidUseCaseLandingProps = {
  page: KvartovidMarketingPage;
};

export function KvartovidUseCaseLanding({ page }: KvartovidUseCaseLandingProps) {
  return (
    <div className="min-h-screen bg-[#060d0b] text-ink">
      <KvartovidHeader />

      <main className="relative pt-20 sm:pt-24">
        <section className="mx-auto max-w-content px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
          <Link className="text-sm font-semibold text-muted transition hover:text-amber-400" href="/kvartovid">
            ← {BRAND.kvartovid}
          </Link>
          <span className="mt-6 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
            {page.badge}
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{page.h1}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kvartovid/create">
              <Button className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
                Создать объявление
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02] py-10 sm:py-14">
          <div className="mx-auto max-w-content px-4 sm:px-6">
            <h2 className="text-2xl font-bold">Что получите</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {page.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-2xl font-bold">Как это работает</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {page.workflow.map((step, index) => (
              <div key={step.title} className="rounded-card border border-white/10 bg-card/50 p-5">
                <span className="text-xs font-black text-amber-400">0{index + 1}</span>
                <h3 className="mt-2 font-bold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {page.faq.length > 0 ? (
          <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
            <h2 className="text-2xl font-bold">Вопросы</h2>
            <div className="mt-6 divide-y divide-white/10 rounded-card border border-white/10">
              {page.faq.map((item) => (
                <div key={item.question} className="p-5">
                  <h3 className="font-semibold text-ink">{item.question}</h3>
                  <p className="mt-2 text-sm text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <KvartovidFooter />
    </div>
  );
}
