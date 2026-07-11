import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryDemoPreviewClient } from "@/components/storystudio/StoryDemoPreviewClient";
import { createStoryStudioMetadata } from "@/lib/seo/storystudio";

export const metadata: Metadata = createStoryStudioMetadata({
  title: "Превью истории",
  description: "Демо-превью сгенерированной истории. Зарегистрируйтесь, чтобы продолжить работу над проектом.",
  path: "/storystudio/preview",
  noIndex: true
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoryDemoPreviewPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07050d]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      }
    >
      <StoryDemoPreviewClient storyId={id} />
    </Suspense>
  );
}
