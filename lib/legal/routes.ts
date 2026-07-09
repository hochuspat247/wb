export const LEGAL_DOCUMENTS = [
  {
    slug: "personal-data",
    href: "/legal/personal-data",
    label: "Политика обработки персональных данных"
  },
  {
    slug: "terms",
    href: "/legal/terms",
    label: "Пользовательское соглашение"
  },
  {
    slug: "offer",
    href: "/legal/offer",
    label: "Публичная оферта"
  }
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENTS)[number]["slug"];
