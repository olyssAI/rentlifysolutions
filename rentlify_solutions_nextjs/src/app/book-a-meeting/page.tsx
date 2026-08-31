import { createSearchEngineMetadata } from '@/configuration/search-engine-metadata'
import { BookMeetingPage } from '@/modules/landing/book-meeting/book-meeting-page'

export const metadata = createSearchEngineMetadata({
  title: 'Book a Digital Solution Consultation',
  description:
    'Schedule a focused meeting with Rentlify Solutions to discuss your business, digital requirements, and the right monthly technology plan.',
  pathname: '/book-a-meeting',
})

export default function Page() {
  return <BookMeetingPage />
}
