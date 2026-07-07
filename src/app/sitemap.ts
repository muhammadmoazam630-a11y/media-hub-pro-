import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://mediahub.pro", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://mediahub.pro/analyze", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://mediahub.pro/history", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mediahub.pro/favorites", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://mediahub.pro/admin", lastModified: new Date(), changeFrequency: "daily", priority: 0.3 },
  ]
}
