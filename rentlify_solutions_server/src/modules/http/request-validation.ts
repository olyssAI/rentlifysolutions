import type { Response } from 'express'
import type { z } from 'zod'

export const parseRequestValue = <Schema extends z.ZodType>(schema: Schema, value: unknown, response: Response) => {
  const result = schema.safeParse(value)

  if (!result.success) {
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Review the highlighted fields and try again.',
        fields: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
    })
    return null
  }

  return result.data as z.output<Schema>
}
