import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { RestaurantsPage } from '@/modules/landing/restaurants/restaurants-page'

export const metadata = createSearchEngineMetadata({
  title: 'Complete Restaurant Management and Ordering Platform',
  description:
    'Connect your branded restaurant app, website, digital menu, online orders, kitchen workflow, delivery, branches, customers, loyalty, inventory, and reporting through one scalable platform.',
  pathname: '/restaurants',
})

export default function Page() {
  return <RestaurantsPage />
}
