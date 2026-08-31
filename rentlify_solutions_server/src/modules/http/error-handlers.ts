import type { ErrorRequestHandler, RequestHandler } from 'express'

import { HttpError } from './http-error.js'

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  })
}

/**
 * Terminal error handler. Details are logged server-side; the client only ever receives
 * a generic message so that stack traces and internal identifiers are never exposed.
 */
export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error)
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields === undefined ? {} : { fields: error.fields }),
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    })
    return
  }

  request.log?.error({ err: error }, 'Unhandled request error.')

  response.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  })
}
