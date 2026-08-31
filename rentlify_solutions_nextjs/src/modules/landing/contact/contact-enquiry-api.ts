import { z } from 'zod'
import { publicApplicationEnvironment } from '@/configuration/public-application-environment'
import type { ContactEnquiryInput } from './contact-enquiry-schema'

const contactEnquiryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ accepted: z.literal(true) }),
})

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string().min(1).max(300) }),
})

export class ContactEnquiryRequestError extends Error {}

export async function submitContactEnquiry(contactEnquiry: ContactEnquiryInput) {
  const response = await fetch(`${publicApplicationEnvironment.NEXT_PUBLIC_RENTLIFY_API_URL}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contactEnquiry),
    signal: AbortSignal.timeout(12_000),
  })
  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errorResponse = errorResponseSchema.safeParse(responseBody)
    throw new ContactEnquiryRequestError(
      errorResponse.success ? errorResponse.data.error.message : 'Your enquiry could not be sent. Please try again.',
    )
  }

  return contactEnquiryResponseSchema.parse(responseBody)
}
