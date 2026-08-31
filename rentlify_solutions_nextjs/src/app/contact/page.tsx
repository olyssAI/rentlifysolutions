import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { ContactPage } from '@/modules/landing/contact/contact-page'

export const metadata = createSearchEngineMetadata({
  title: 'Contact Our Digital Solutions Team',
  description:
    'Tell Rentlify Solutions about your business and the mobile app, website, or custom software you need to launch.',
  pathname: '/contact',
})

export default function Page() {
  return <ContactPage />
}
