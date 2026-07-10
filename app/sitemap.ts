import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { platformPages } from "@/lib/marketing/platformPages";
import { storyStudioConfig } from "@/lib/seo/storystudio";
import { kvartovidConfig } from "@/lib/seo/kvartovid";
import { storyStudioMarketingPages } from "@/lib/storystudio/marketingPages";
import { kvartovidMarketingPages } from "@/lib/kvartovid/marketingPages";
import { LEGAL_DOCUMENTS } from "@/lib/legal/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const storyOg = absoluteUrl(storyStudioConfig.ogImagePath);
  const kvartovidOg = absoluteUrl(kvartovidConfig.ogImagePath);

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
    {
      url: absoluteUrl("/storystudio"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      images: [storyOg]
    },
    ...storyStudioMarketingPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.88,
      images: [storyOg]
    })),
    {
      url: absoluteUrl("/storystudio/create"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [storyOg]
    },
    {
      url: absoluteUrl("/kvartovid"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      images: [kvartovidOg]
    },
    ...kvartovidMarketingPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.88,
      images: [kvartovidOg]
    })),
    {
      url: absoluteUrl("/kvartovid/create"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [kvartovidOg]
    },
    ...LEGAL_DOCUMENTS.map((doc) => ({
      url: absoluteUrl(doc.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4
    }))
  ];
}
