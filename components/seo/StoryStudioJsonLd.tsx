import { buildStoryStudioCreateJsonLd, buildStoryStudioHomeJsonLd } from "@/lib/seo/storystudio-jsonld";

type StoryStudioJsonLdProps = {
  variant?: "home" | "create";
};

export function StoryStudioJsonLd({ variant = "home" }: StoryStudioJsonLdProps) {
  const jsonLd = variant === "create" ? buildStoryStudioCreateJsonLd() : buildStoryStudioHomeJsonLd();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
}
