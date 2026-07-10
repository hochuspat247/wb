import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KvartovidJsonLd } from "@/components/seo/KvartovidJsonLd";
import { KvartovidUseCaseLanding } from "@/components/kvartovid/KvartovidUseCaseLanding";
import { createKvartovidMetadata } from "@/lib/seo/kvartovid";
import { getKvartovidMarketingPage, kvartovidMarketingPages } from "@/lib/kvartovid/marketingPages";

type PageProps = {
  params: Promise<{ usecase: string }>;
};

export async function generateStaticParams() {
  return kvartovidMarketingPages.map((page) => ({ usecase: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { usecase } = await params;
  const page = getKvartovidMarketingPage(usecase);

  if (!page) {
    return createKvartovidMetadata({ title: "Страница не найдена", noIndex: true });
  }

  return createKvartovidMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords
  });
}

export default async function KvartovidUseCasePage({ params }: PageProps) {
  const { usecase } = await params;
  const page = getKvartovidMarketingPage(usecase);

  if (!page) {
    notFound();
  }

  return (
    <>
      <KvartovidJsonLd variant="usecase" page={page} />
      <KvartovidUseCaseLanding page={page} />
    </>
  );
}
