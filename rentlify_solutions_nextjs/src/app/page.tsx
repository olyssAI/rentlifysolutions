import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { HomePage } from '@/modules/landing/home/home-page'

export const metadata = createSearchEngineMetadata({
  title: 'Rent Your Digital Business',
  description:
    'Launch a branded mobile app, website, or custom business platform through a practical monthly plan instead of a heavy upfront investment.',
  pathname: '/',
})

export default function Page() {
  return <HomePage />
}
