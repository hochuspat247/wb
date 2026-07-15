import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storyStudioMarketingPages } from "@/lib/storystudio/marketingPages";

export function StoryStudioSeoLinksSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14" id="use-cases">
      <div className="mx-auto max-w-3xl text-center">
        <p className="story-fairy-eyebrow">Направления</p>
        <h2 className="story-fairy-title mt-3 text-3xl text-moon sm:text-4xl">Для разных форматов авторов</h2>
        <p className="mt-3 text-muted">
          Отдельные страницы под популярные запросы: фанфики, романы, сценарии и генерация персонажей.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {storyStudioMarketingPages.map((page) => (
          <Link
            className="story-fairy-panel group rounded-card p-5 transition hover:border-gold/40"
            href={page.path}
            key={page.slug}
          >
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{page.badge}</span>
            <h3 className="mt-2 font-fairy text-xl font-semibold text-moon group-hover:text-gold">{page.h1}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{page.lead}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-gold">
              Подробнее
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
