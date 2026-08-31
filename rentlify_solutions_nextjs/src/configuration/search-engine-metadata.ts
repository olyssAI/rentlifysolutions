import type { Metadata } from 'next'

export const rentlifyWebsiteUrl = 'https://rentlifysolutions.com'

type PageMetadataInput = {
  title: string
  description: string
  pathname: `/${string}` | '/'
}

export function createSearchEngineMetadata({ title, description, pathname }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      title,
      description,
      url: pathname,
      siteName: 'Rentlify Solutions',
      locale: 'en_PK',
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Rentlify Solutions' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}
