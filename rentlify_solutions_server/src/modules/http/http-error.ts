export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly fields?: Array<{ path: string; message: string }>,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
