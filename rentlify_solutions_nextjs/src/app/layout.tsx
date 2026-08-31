import type { Metadata } from 'next'
import { Fraunces, Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { rentlifyWebsiteUrl } from '@/configuration/search-engine-metadata'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
})

const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(rentlifyWebsiteUrl),
  applicationName: 'Rentlify Solutions',
  authors: [{ name: 'Rentlify Solutions', url: rentlifyWebsiteUrl }],
  creator: 'Rentlify Solutions',
  publisher: 'Rentlify Solutions',
  category: 'technology',
  keywords: [
    'monthly business software',
    'restaurant ordering app',
    'custom mobile applications',
    'business websites Pakistan',
    'digital business solutions',
    'Rentlify Solutions',
  ],
  icons: { icon: [{ url: '/rentlify-favicon.svg', type: 'image/svg+xml' }] },
  title: {
    default: 'Rentlify Solutions | Rent Your Digital Business',
    template: '%s | Rentlify Solutions',
  },
  description: 'Branded mobile apps, websites, and business software through flexible monthly technology plans.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Rentlify Solutions',
  url: rentlifyWebsiteUrl,
  logo: `${rentlifyWebsiteUrl}/rentlify-favicon.svg`,
  description: 'Mobile apps, websites, and business software through flexible monthly technology plans.',
  slogan: 'We Build It. We Brand It. You Rent It.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Islamabad',
    addressCountry: 'PK',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <NextTopLoader color="#6d35b4" height={2} shadow={false} showSpinner={false} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
