import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { RestaurantsPage } from '@/modules/landing/restaurants/restaurants-page'

export const metadata = createSearchEngineMetadata({
  title: 'Restaurant Ordering App and Management Platform',
  description:
    'Give your restaurant a branded customer ordering app, published digital menu, cash ordering, and an owner management dashboard through a monthly plan.',
  pathname: '/restaurants',
})

export default function Page() {
  return <RestaurantsPage />
}
