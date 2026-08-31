import { z } from 'zod'

export const contactIndustryValues = ['RESTAURANT', 'CLINIC', 'GYM', 'ACADEMY', 'RETAIL', 'SALON', 'OTHER'] as const

export const contactHelpTypeValues = [
  'MOBILE_APP',
  'WEBSITE',
  'BUSINESS_SOFTWARE',
  'COMPLETE_SOLUTION',
  'NOT_SURE',
] as const

export const contactEnquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name must be 100 characters or fewer.'),
    email: z
      .string()
      .trim()
      .max(254)
      .email('Enter a valid email address.')
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number must be 30 characters or fewer.')
      .refine((value) => value === '' || /^\+?[0-9 ()-]{7,30}$/.test(value), 'Enter a valid phone number.'),
    businessName: z
      .string()
      .trim()
      .min(2, 'Enter your business name.')
      .max(120, 'Business name must be 120 characters or fewer.'),
    industry: z.enum(contactIndustryValues, { error: 'Select your industry.' }),
    helpType: z.enum(contactHelpTypeValues, { error: 'Select the type of help you need.' }),
    message: z
      .string()
      .trim()
      .min(30, 'Tell us a little more using at least 30 characters.')
      .max(2_000, 'Message must be 2,000 characters or fewer.'),
    website: z.string().max(200),
  })
  .strict()

export type ContactEnquiry = z.output<typeof contactEnquirySchema>
