import { PlatformLanding } from "@/components/marketing/PlatformLanding";
import { getPlatformPage } from "@/lib/marketing/platformPages";
import { createPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [{ slug: "wildberries" }, { slug: "ozon" }, { slug: "avito" }];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getPlatformPage(slug);

  if (!page) {
    return createPageMetadata({ title: "Страница не найдена", noIndex: true });
  }

  return createPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path
  });
}

export default async function PlatformPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPlatformPage(slug);

  if (!page) {
    notFound();
  }

  return <PlatformLanding page={page} />;
}
