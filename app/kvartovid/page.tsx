import type { Metadata } from "next";
import { KvartovidJsonLd } from "@/components/seo/KvartovidJsonLd";
import { KvartovidLanding } from "@/components/kvartovid/KvartovidLanding";
import { createKvartovidMetadata } from "@/lib/seo/kvartovid";

export const metadata: Metadata = createKvartovidMetadata({
  path: "/kvartovid"
});

export default function KvartovidPage() {
  return (
    <>
      <KvartovidJsonLd variant="home" />
      <KvartovidLanding />
    </>
  );
}
