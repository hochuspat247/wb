import type { LegalDocumentContent } from "@/lib/legal/content.types";
import type { LegalDocumentSlug } from "@/lib/legal/routes";
import { publicOffer } from "@/lib/legal/documents/offer";
import { personalDataPolicy } from "@/lib/legal/documents/personal-data";
import { termsOfService } from "@/lib/legal/documents/terms";

export type { LegalDocumentContent, LegalSection } from "@/lib/legal/content.types";

export const LEGAL_CONTENT: Record<LegalDocumentSlug, LegalDocumentContent> = {
  "personal-data": personalDataPolicy,
  terms: termsOfService,
  offer: publicOffer
};
