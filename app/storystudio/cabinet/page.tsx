import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryStudioCabinet } from "@/components/storystudio/StoryStudioCabinet";
import { Loader } from "@/components/ui/Loader";
import { createStoryStudioMetadata } from "@/lib/seo/storystudio";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = createStoryStudioMetadata({
  title: "Кабинет",
  description: `Личный кабинет ${BRAND.storyStudio}: истории, персонажи, карта связей, редактор глав и видео-серии.`,
  path: "/storystudio/cabinet",
  noIndex: true
});

export default function StoryStudioCabinetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07050d]">
          <Loader />
        </div>
      }
    >
      <StoryStudioCabinet />
    </Suspense>
  );
}
