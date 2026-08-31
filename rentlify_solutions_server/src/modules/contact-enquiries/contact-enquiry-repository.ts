import { randomUUID } from 'node:crypto'

import { database } from '../../database/client.js'
import { contactEnquiry } from '../../database/schema/platform-schema.js'
import type { ContactEnquiry } from './contact-enquiry-validation.js'

const create = async (enquiry: ContactEnquiry) => {
  const [createdEnquiry] = await database
    .insert(contactEnquiry)
    .values({
      id: randomUUID(),
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || null,
      businessName: enquiry.businessName,
      industry: enquiry.industry,
      helpType: enquiry.helpType,
      message: enquiry.message,
    })
    .returning({ id: contactEnquiry.id })

  if (!createdEnquiry) throw new Error('Contact enquiry insertion returned no record.')
  return createdEnquiry
}

export const contactEnquiryRepository = { create }
