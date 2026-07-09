import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only real indexable URLs — hash anchors are not separate pages for crawlers.
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/storystudio"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/storystudio/create"), lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  ];
}
