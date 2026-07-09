import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryStudioCabinet } from "@/components/storystudio/StoryStudioCabinet";
import { Loader } from "@/components/ui/Loader";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Кабинет StoryStudio",
  description: "Ваши истории, персонажи, дерево связей и редактор глав.",
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
