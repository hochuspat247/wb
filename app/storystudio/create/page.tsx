import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryCreateForm } from "@/components/storystudio/StoryCreateForm";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Создать историю с AI",
  description: "Опишите основу произведения и переходите в новую историю, когда будете готовы.",
  path: "/storystudio/create"
});

export default function StoryStudioCreatePage() {
  return (
    <div className="min-h-screen bg-[#07050d]">
      <StoryStudioHeader />
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-24 sm:px-6">
        <Link
          href="/storystudio"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-violet"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
        <h1 className="text-3xl font-bold">Создать историю с AI</h1>
        <p className="mt-2 text-muted">
          Опишите основу произведения и переходите в новую историю, когда будете готовы.
        </p>
        <div className="mt-8">
          <StoryCreateForm />
        </div>
      </div>
    </div>
  );
}
