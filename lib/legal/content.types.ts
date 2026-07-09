import type { LegalDocumentSlug } from "@/lib/legal/routes";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  afterList?: string[];
};

export type LegalDocumentContent = {
  slug: LegalDocumentSlug;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};
