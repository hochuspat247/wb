import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LEGAL_CONTENT } from "@/lib/legal/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: LEGAL_CONTENT.terms.title,
  description: LEGAL_CONTENT.terms.description,
  path: "/legal/terms"
});

export default function TermsPage() {
  return <LegalDocumentPage document={LEGAL_CONTENT.terms} />;
}
