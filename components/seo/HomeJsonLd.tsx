import { buildHomeJsonLd } from "@/lib/seo/jsonld";

export function HomeJsonLd() {
  const jsonLd = buildHomeJsonLd();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
}
