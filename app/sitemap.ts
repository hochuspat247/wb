import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/#examples"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/#compare"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/#pricing"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/#faq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 }
  ];
}
