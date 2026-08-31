import type { MetadataRoute } from 'next'

import { rentlifyWebsiteUrl } from '@/configuration/search-engine-metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-08-30')

  return [
    { url: rentlifyWebsiteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${rentlifyWebsiteUrl}/restaurants`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${rentlifyWebsiteUrl}/upcoming-solutions`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${rentlifyWebsiteUrl}/book-a-meeting`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${rentlifyWebsiteUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
