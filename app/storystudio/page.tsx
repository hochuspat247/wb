import type { Metadata } from "next";
import { StoryStudioJsonLd } from "@/components/seo/StoryStudioJsonLd";
import { StoryStudioLanding } from "@/components/storystudio/StoryStudioLanding";
import { createStoryStudioMetadata } from "@/lib/seo/storystudio";

export const metadata: Metadata = createStoryStudioMetadata({
  path: "/storystudio"
});

export default function StoryStudioPage() {
  return (
    <>
      <StoryStudioJsonLd variant="home" />
      <StoryStudioLanding />
    </>
  );
}
