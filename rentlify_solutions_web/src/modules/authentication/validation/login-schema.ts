import { z } from 'zod'

/**
 * Sign-in only checks that credentials were supplied. Password *strength* rules belong to
 * account creation, not to sign-in: enforcing them here locks out any account whose password
 * predates the current policy, and it advertises the policy to anyone probing the form.
 * The server remains the authority on whether the credentials are valid.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .max(254, 'Email address is too long.')
    .email('Enter a valid email address.')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Enter your password.').max(128, 'Password cannot contain more than 128 characters.'),
})

export type LoginValues = z.infer<typeof loginSchema>
