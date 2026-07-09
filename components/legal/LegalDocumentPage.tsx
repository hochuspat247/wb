import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import type { LegalDocumentContent } from "@/lib/legal/content";

type LegalDocumentPageProps = {
  document: LegalDocumentContent;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-paper">
      <Header />

      <div className="section-shell py-10 md:py-14">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <article className="mx-auto max-w-3xl">
          <header className="border-b border-clay pb-6">
            <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">{document.title}</h1>
            <p className="mt-3 text-sm font-medium text-muted">Обновлено: {document.updatedAt}</p>
          </header>

          <div className="prose-legal mt-8 space-y-8">
            {document.sections.map((section) => (
              <section id={section.id} key={section.id}>
                <h2 className="text-lg font-black text-ink">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p className="mt-3 text-sm font-medium leading-relaxed text-muted" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-relaxed text-muted">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <footer className="mt-10 border-t border-clay pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Другие документы</p>
            <LegalFooterLinks
              className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1"
              linkClassName="text-sm font-semibold text-accent transition hover:underline"
              separator=""
            />
          </footer>
        </article>
      </div>

      <Footer />
    </main>
  );
}
