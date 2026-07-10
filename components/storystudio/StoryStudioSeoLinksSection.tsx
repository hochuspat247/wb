import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storyStudioMarketingPages } from "@/lib/storystudio/marketingPages";

export function StoryStudioSeoLinksSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14" id="use-cases">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Сценарии для авторов</h2>
        <p className="mt-3 text-muted">
          Отдельные страницы под популярные запросы: фанфики, романы, сценарии и генерация персонажей.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {storyStudioMarketingPages.map((page) => (
          <Link
            className="group rounded-card border border-white/10 bg-card/60 p-5 transition hover:border-violet/40 hover:bg-violet/5"
            href={page.path}
            key={page.slug}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-violet">{page.badge}</span>
            <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-violet">{page.h1}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{page.lead}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet">
              Подробнее
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
