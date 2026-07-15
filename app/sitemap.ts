import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { platformPages } from "@/lib/marketing/platformPages";
import { LEGAL_DOCUMENTS } from "@/lib/legal/routes";

/**
 * MarketCard-only sitemap.
 * StoryStudio and KvartoVid stay on this host for now, but are excluded so
 * the MarketCard domain keeps a clear topical focus for search engines.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...platformPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9
    })),
    ...LEGAL_DOCUMENTS.map((doc) => ({
      url: absoluteUrl(doc.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3
    }))
  ];
}
