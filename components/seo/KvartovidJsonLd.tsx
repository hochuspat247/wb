import {
  buildKvartovidCreateJsonLd,
  buildKvartovidHomeJsonLd,
  buildKvartovidUseCaseJsonLd
} from "@/lib/seo/kvartovid-jsonld";
import type { KvartovidMarketingPage } from "@/lib/kvartovid/marketingPages";

type KvartovidJsonLdProps =
  | { variant?: "home" }
  | { variant: "create" }
  | { variant: "usecase"; page: KvartovidMarketingPage };

export function KvartovidJsonLd(props: KvartovidJsonLdProps) {
  const jsonLd =
    props.variant === "create"
      ? buildKvartovidCreateJsonLd()
      : props.variant === "usecase"
        ? buildKvartovidUseCaseJsonLd(props.page)
        : buildKvartovidHomeJsonLd();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
}
