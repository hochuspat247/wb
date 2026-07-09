import type { Metadata } from "next";
import { StoryStudioLanding } from "@/components/storystudio/StoryStudioLanding";
import { createPageMetadata } from "@/lib/seo";
import { STORY_GENERATION_PRICE_RUB, formatStoryRub } from "@/lib/storystudio/pricing";

export const metadata: Metadata = createPageMetadata({
  title: "StoryStudio — AI генератор историй",
  description: `Создавайте истории, персонажей, главы и портреты с ИИ. От ${formatStoryRub(STORY_GENERATION_PRICE_RUB)} за генерацию — дешевле аналогов.`,
  path: "/storystudio"
});

export default function StoryStudioPage() {
  return <StoryStudioLanding />;
}
