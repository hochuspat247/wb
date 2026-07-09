import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LEGAL_CONTENT } from "@/lib/legal/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: LEGAL_CONTENT.offer.title,
  description: LEGAL_CONTENT.offer.description,
  path: "/legal/offer"
});

export default function OfferPage() {
  return <LegalDocumentPage document={LEGAL_CONTENT.offer} />;
}
