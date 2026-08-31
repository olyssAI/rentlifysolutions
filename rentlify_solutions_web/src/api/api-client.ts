import { z } from 'zod'

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? ''
const defaultRequestTimeoutMilliseconds = 15_000

const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        fields: z.array(z.object({ path: z.string().min(1), message: z.string().min(1) }).strict()).optional(),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict()

export type ApiFieldError = { path: string; message: string }

export class ApiError extends Error {
  readonly code: string
  readonly fields: ApiFieldError[]
  readonly details: unknown
  readonly status: number

  constructor(status: number, code: string, message: string, fields: ApiFieldError[] = [], details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
    this.details = details
  }
}

const redirectExpiredSessionToLogin = () => {
  if (window.location.pathname === '/login') return
  const currentPath = `${window.location.pathname}${window.location.search}`
  const query = new URLSearchParams({ reason: 'session-expired', from: currentPath })
  window.location.replace(`/login?${query.toString()}`)
}

export async function apiRequest<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  options: RequestInit = {},
): Promise<z.output<Schema>> {
  const timeoutSignal = AbortSignal.timeout(defaultRequestTimeoutMilliseconds)
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal,
    })
  } catch {
    if (signal.aborted) {
      throw new ApiError(408, 'REQUEST_TIMEOUT', 'The server took too long to respond. Please try again.')
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'The server could not be reached. Check your connection and try again.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(body)
    if (response.status === 401) redirectExpiredSessionToLogin()
    if (parsedError.success) {
      throw new ApiError(
        response.status,
        parsedError.data.error.code,
        parsedError.data.error.message,
        parsedError.data.error.fields,
        parsedError.data.error.details,
      )
    }
    throw new ApiError(response.status, 'UNEXPECTED_RESPONSE', 'The server returned an unexpected response.')
  }

  const data = typeof body === 'object' && body !== null && 'data' in body ? body.data : undefined
  const parsedData = schema.safeParse(data)
  if (!parsedData.success) {
    throw new ApiError(502, 'INVALID_SERVER_RESPONSE', 'The server response could not be verified.')
  }
  return parsedData.data
}
