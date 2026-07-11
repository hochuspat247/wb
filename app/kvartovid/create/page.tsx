import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KvartovidJsonLd } from "@/components/seo/KvartovidJsonLd";
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
    "обложка авито квартира",
    "планировка квартиры для объявления",
    "текст для циан квартира",
    "объявление домклик онлайн"
  ]
});

export default function KvartovidCreatePage() {
  return (
    <>
      <KvartovidJsonLd variant="create" />
      <div className="relative min-h-screen overflow-hidden bg-[#060d0b]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-amber-500/12 blur-[120px]" />
          <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-emerald-500/8 blur-[100px]" />
        </div>
      <KvartovidHeader />
      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-24 sm:px-6 lg:max-w-5xl">
        <Link
          href="/kvartovid"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную {BRAND.kvartovid}
        </Link>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Конструктор объявления</p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Создать объявление о квартире</h1>
          <p className="mt-3 text-muted">{kvartovidCreateDescription}</p>
        </div>
        <div className="mt-8">
          <KvartovidCreateForm />
        </div>
      </div>
      <KvartovidFooter />
      </div>
    </>
  );
}
