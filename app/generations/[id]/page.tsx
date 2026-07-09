import { DemoResultClient } from "@/components/demo/DemoResultClient";
import { createPageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = createPageMetadata({
  title: "Демо-карточка готова",
  description: `Демо-результат генерации ${BRAND.marketCard}.`,
  path: "/generations",
  noIndex: true
});

export default async function GenerationResultPage({ params }: PageProps) {
  const { id } = await params;
  return <DemoResultClient generationId={id} />;
}
