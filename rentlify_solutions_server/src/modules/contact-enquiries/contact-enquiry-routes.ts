import { Router } from 'express'

import { environment } from '../../config/environment.js'
import { HttpError } from '../http/http-error.js'
import { throttleByClientIp } from '../http/request-throttle.js'
import { parseRequestValue } from '../http/request-validation.js'
import { contactEnquiryService } from './contact-enquiry-service.js'
import { contactEnquirySchema } from './contact-enquiry-validation.js'

export const contactEnquiryRouter = Router()

contactEnquiryRouter.use((request, _response, next) => {
  if (request.get('origin') !== environment.MARKETING_SITE_ORIGIN) {
    throw new HttpError(403, 'UNTRUSTED_ORIGIN', 'This request origin is not allowed.')
  }
  next()
})
contactEnquiryRouter.use(throttleByClientIp({ bucket: 'contact-enquiry', windowSeconds: 3_600, maximumRequests: 5 }))

contactEnquiryRouter.post('/', async (request, response) => {
  const enquiry = parseRequestValue(contactEnquirySchema, request.body, response)
  if (!enquiry) return

  if (enquiry.website) {
    response.status(202).json({ success: true, data: { accepted: true } })
    return
  }

  await contactEnquiryService.createContactEnquiry(enquiry)
  response.status(202).json({ success: true, data: { accepted: true } })
})
