import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryShareClient } from "@/components/storystudio/StoryShareClient";
import { createStoryStudioMetadata } from "@/lib/seo/storystudio";

export const metadata: Metadata = createStoryStudioMetadata({
  title: "Чтение истории",
  description: "Публичная ссылка на историю из СториСтудио.",
  path: "/storystudio/s",
  noIndex: true
});

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function StorySharePage({ params }: PageProps) {
  const { shareId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07050d]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      }
    >
      <StoryShareClient shareId={shareId} />
    </Suspense>
  );
}
