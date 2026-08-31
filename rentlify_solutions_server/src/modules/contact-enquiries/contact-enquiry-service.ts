import type { ContactEnquiry } from './contact-enquiry-validation.js'
import { contactEnquiryRepository } from './contact-enquiry-repository.js'

const createContactEnquiry = async (enquiry: ContactEnquiry) => contactEnquiryRepository.create(enquiry)

export const contactEnquiryService = { createContactEnquiry }
