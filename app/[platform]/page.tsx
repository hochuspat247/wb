import { PlatformLanding } from "@/components/marketing/PlatformLanding";
import { getPlatformPage } from "@/lib/marketing/platformPages";
import { createPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ platform: string }>;
};

export async function generateStaticParams() {
  return [{ platform: "wildberries" }, { platform: "ozon" }, { platform: "avito" }];
}

export async function generateMetadata({ params }: PageProps) {
  const { platform } = await params;
  const page = getPlatformPage(platform);

  if (!page) {
    return createPageMetadata({ title: "Страница не найдена", noIndex: true });
  }

  return createPageMetadata({
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    path: page.path
  });
}

export default async function PlatformPage({ params }: PageProps) {
  const { platform } = await params;
  const page = getPlatformPage(platform);

  if (!page) {
    notFound();
  }

  return <PlatformLanding page={page} />;
}
