import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { storyStudioConfig } from "@/lib/seo/storystudio";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const storyOg = absoluteUrl(storyStudioConfig.ogImagePath);

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/storystudio"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      images: [storyOg]
    },
    {
      url: absoluteUrl("/storystudio/create"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      images: [storyOg]
    }
  ];
}
