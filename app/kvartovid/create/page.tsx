import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KvartovidCreateForm } from "@/components/kvartovid/KvartovidCreateForm";
import { KvartovidHeader } from "@/components/kvartovid/KvartovidHeader";
import { KvartovidFooter } from "@/components/kvartovid/KvartovidFooter";
import { createKvartovidMetadata, kvartovidCreateDescription } from "@/lib/seo/kvartovid";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = createKvartovidMetadata({
  title: "Создать объявление о квартире",
  description: kvartovidCreateDescription,
  path: "/kvartovid/create",
  keywords: [
    "создать объявление о квартире",
    "описание квартиры ии",
    "генератор объявления недвижимость",
    "обложка авито квартира"
  ]
});

export default function KvartovidCreatePage() {
  return (
    <div className="min-h-screen bg-[#060d0b]">
      <KvartovidHeader />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <Link
          href="/kvartovid"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную {BRAND.kvartovid}
        </Link>
        <h1 className="text-3xl font-bold text-ink">Создать объявление о квартире</h1>
        <p className="mt-2 text-muted">{kvartovidCreateDescription}</p>
        <div className="mt-8">
          <KvartovidCreateForm />
        </div>
      </div>
      <KvartovidFooter />
    </div>
  );
}
