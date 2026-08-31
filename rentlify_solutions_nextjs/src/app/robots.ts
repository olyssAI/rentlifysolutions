import type { MetadataRoute } from 'next'

import { rentlifyWebsiteUrl } from '@/configuration/search-engine-metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${rentlifyWebsiteUrl}/sitemap.xml`,
    host: rentlifyWebsiteUrl,
  }
}
