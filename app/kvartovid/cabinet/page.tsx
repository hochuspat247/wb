import type { Metadata } from "next";
import { Suspense } from "react";
import { KvartovidCabinet } from "@/components/kvartovid/KvartovidCabinet";
import { Loader } from "@/components/ui/Loader";
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060d0b]">
          <Loader />
        </div>
      }
    >
      <KvartovidCabinet />
    </Suspense>
  );
}
