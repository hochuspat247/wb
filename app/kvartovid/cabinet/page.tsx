import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KvartovidHeader } from "@/components/kvartovid/KvartovidHeader";
import { KvartovidFooter } from "@/components/kvartovid/KvartovidFooter";
import { Button } from "@/components/ui/Button";
import { createKvartovidMetadata } from "@/lib/seo/kvartovid";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = createKvartovidMetadata({
  title: "Мои объявления",
  description: `Кабинет ${BRAND.kvartovid} — история упакованных объектов недвижимости.`,
  path: "/kvartovid/cabinet",
  noIndex: true
});

export default function KvartovidCabinetPage() {
  return (
    <div className="min-h-screen bg-[#060d0b] text-ink">
      <KvartovidHeader />
      <main className="mx-auto max-w-content px-4 pb-20 pt-24 sm:px-6">
        <h1 className="text-3xl font-bold">Мои объявления</h1>
        <p className="mt-2 max-w-xl text-muted">
          История объектов и пакеты для риэлторов появятся в следующем релизе. Сейчас экспортируйте результат сразу
          после генерации.
        </p>
        <div className="mt-8 rounded-card border border-white/10 bg-card/50 p-8 text-center">
          <p className="text-muted">Пока нет сохранённых объявлений в кабинете.</p>
          <Link href="/kvartovid/create" className="mt-6 inline-block">
            <Button className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
              Создать объявление
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <KvartovidFooter />
    </div>
  );
}
