import { z } from 'zod'

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(128),
    newPassword: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(128)
      .regex(/[a-z]/, 'Include a lowercase letter.')
      .regex(/[A-Z]/, 'Include an uppercase letter.')
      .regex(/[0-9]/, 'Include a number.')
      .regex(/[^A-Za-z0-9]/, 'Include a symbol.')
      .regex(/^\S+$/, 'Do not use spaces.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.').max(128),
  })
  .strict()
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a different password.' })
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'The passwords do not match.' })
    }
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>
