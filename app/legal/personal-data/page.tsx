import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LEGAL_CONTENT } from "@/lib/legal/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: LEGAL_CONTENT["personal-data"].title,
  description: LEGAL_CONTENT["personal-data"].description,
  path: "/legal/personal-data"
});

export default function PersonalDataPolicyPage() {
  return <LegalDocumentPage document={LEGAL_CONTENT["personal-data"]} />;
}
