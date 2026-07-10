import type { Metadata } from "next";
import { KvartovidLanding } from "@/components/kvartovid/KvartovidLanding";
import { createKvartovidMetadata } from "@/lib/seo/kvartovid";

export const metadata: Metadata = createKvartovidMetadata({
  path: "/kvartovid"
});

export default function KvartovidPage() {
  return <KvartovidLanding />;
}
