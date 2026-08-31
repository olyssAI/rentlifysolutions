import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { UpcomingSolutionsPage } from '@/modules/landing/upcoming-solutions/upcoming-solutions-page'

export const metadata = createSearchEngineMetadata({
  title: 'Upcoming Digital Business Solutions',
  description:
    'Explore the sectors Rentlify Solutions is researching next, including clinics, gyms, retail, education, real estate, and professional services.',
  pathname: '/upcoming-solutions',
})

export default function Page() {
  return <UpcomingSolutionsPage />
}
