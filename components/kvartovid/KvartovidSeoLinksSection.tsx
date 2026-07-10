import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { kvartovidMarketingPages } from "@/lib/kvartovid/marketingPages";

export function KvartovidSeoLinksSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16" id="use-cases">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Сценарии использования</h2>
        <p className="mt-3 text-muted">Продажа, аренда, Авито и работа риэлтора — отдельные посадочные под запросы из поиска.</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {kvartovidMarketingPages.map((page) => (
          <Link
            key={page.slug}
            href={page.path}
            className="group rounded-card border border-white/10 bg-card/50 p-6 transition hover:border-amber-500/30 hover:bg-amber-500/5"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{page.badge}</span>
            <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-amber-300">{page.h1}</h3>
            <p className="mt-2 text-sm text-muted line-clamp-2">{page.lead}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
              Подробнее
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
