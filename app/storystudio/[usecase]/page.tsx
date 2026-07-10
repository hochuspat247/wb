import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryStudioUseCaseLanding } from "@/components/storystudio/StoryStudioUseCaseLanding";
import { createStoryStudioMetadata } from "@/lib/seo/storystudio";
import { getStoryStudioMarketingPage, storyStudioMarketingPages } from "@/lib/storystudio/marketingPages";

type PageProps = {
  params: Promise<{ usecase: string }>;
};

export async function generateStaticParams() {
  return storyStudioMarketingPages.map((page) => ({ usecase: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { usecase } = await params;
  const page = getStoryStudioMarketingPage(usecase);

  if (!page) {
    return createStoryStudioMetadata({ title: "Страница не найдена", noIndex: true });
  }

  return createStoryStudioMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords
  });
}

export default async function StoryStudioUseCasePage({ params }: PageProps) {
  const { usecase } = await params;
  const page = getStoryStudioMarketingPage(usecase);

  if (!page) {
    notFound();
  }

  return <StoryStudioUseCaseLanding page={page} />;
}
