import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryStudioJsonLd } from "@/components/seo/StoryStudioJsonLd";
import { StoryCreateForm } from "@/components/storystudio/StoryCreateForm";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import {
  createStoryStudioMetadata,
  storyStudioCreateDescription
} from "@/lib/seo/storystudio";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = createStoryStudioMetadata({
  title: "Создать историю с ИИ",
  description: storyStudioCreateDescription,
  path: "/storystudio/create",
  keywords: [
    "создать историю с ии",
    "генератор сюжета",
    "написать книгу онлайн",
    "ии новелла",
    "создать персонажей",
    "основа романа ии",
    "стористудио создать"
  ]
});

export default function StoryStudioCreatePage() {
  return (
    <>
      <StoryStudioJsonLd variant="create" />
      <div className="min-h-screen bg-[#07050d]">
        <StoryStudioHeader />
        <div className="mx-auto max-w-2xl px-4 pb-20 pt-24 sm:px-6">
          <Link
            href="/storystudio"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-violet"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную {BRAND.storyStudio}
          </Link>
          <h1 className="text-3xl font-bold">Создать историю с ИИ</h1>
          <p className="mt-2 text-muted">{storyStudioCreateDescription}</p>
          <div className="mt-8">
            <StoryCreateForm />
          </div>
        </div>
        <StoryStudioFooter />
      </div>
    </>
  );
}
