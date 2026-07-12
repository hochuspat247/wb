import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { getOtherPlatformPages, type PlatformPageConfig } from "@/lib/marketing/platformPages";
import { buildPlatformJsonLd } from "@/lib/seo/platform-jsonld";

type PlatformLandingProps = {
  page: PlatformPageConfig;
};

export function PlatformLanding({ page }: PlatformLandingProps) {
  const jsonLd = buildPlatformJsonLd(page);
  const otherPlatforms = getOtherPlatformPages(page.slug);

  return (
    <main className="min-h-screen bg-paper">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <Header />
      <section className="section-shell py-12 md:py-16">
        <Reveal immediate>
          <nav aria-label="Хлебные крошки" className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-muted">
            <Link className="transition hover:text-ink" href="/">
              Главная
            </Link>
            <ChevronRight aria-hidden className="text-clay" size={14} />
            <span className="text-ink">{page.marketplaceLabel}</span>
          </nav>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{page.marketplaceLabel}</p>
          <h1 className="mt-4 max-w-4xl text-balance text-4xl font-black leading-tight text-ink md:text-5xl">{page.h1}</h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-muted">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#hero-mini-generator">
              <Button className="py-3" type="button">
                Попробовать бесплатно
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/register">
              <Button className="py-3" type="button" variant="secondary">
                Создать аккаунт
              </Button>
            </Link>
            {page.slug === "wildberries" ? (
              <Link href="/#wildberries">
                <Button className="py-3" type="button" variant="secondary">
                  Публикация на WB
                </Button>
              </Link>
            ) : null}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-clay bg-card py-14 md:py-20">
        <div className="section-shell">
          <h2 className="text-3xl font-black text-ink">Что получает селлер на {page.marketplaceLabel}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {page.benefits.map((benefit) => (
              <li className="flex items-start gap-3 rounded-[18px] border border-clay bg-paper/70 p-4" key={benefit}>
                <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={18} />
                <span className="text-sm font-semibold leading-relaxed text-ink">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-shell py-14 md:py-20">
        <h2 className="text-3xl font-black text-ink">Частые вопросы</h2>
        <div className="mt-8 grid gap-4">
          {page.faq.map((item) => (
            <article className="rounded-[18px] border border-clay bg-card p-5" key={item.question}>
              <h3 className="text-lg font-black text-ink">{item.question}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-clay bg-card py-14 md:py-20">
        <div className="section-shell">
          <h2 className="text-3xl font-black text-ink">Другие площадки</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted">
            Тот же генератор карточек — разные тексты и СЕО под Wildberries, Ozon и Авито.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {otherPlatforms.map((platform) => (
              <li key={platform.slug}>
                <Link
                  className="flex items-center justify-between rounded-[18px] border border-clay bg-paper/70 p-5 transition hover:border-accent/35 hover:bg-paper"
                  href={platform.path}
                >
                  <div>
                    <p className="text-base font-black text-ink">{platform.marketplaceLabel}</p>
                    <p className="mt-1 text-sm font-medium text-muted">{platform.h1}</p>
                  </div>
                  <ArrowRight className="shrink-0 text-accent" size={18} />
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="flex items-center justify-between rounded-[18px] border border-clay bg-paper/70 p-5 transition hover:border-accent/35 hover:bg-paper"
                href="/"
              >
                <div>
                  <p className="text-base font-black text-ink">Все площадки</p>
                  <p className="mt-1 text-sm font-medium text-muted">Главная с примерами, тарифами и демо-генератором</p>
                </div>
                <ArrowRight className="shrink-0 text-accent" size={18} />
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
}
