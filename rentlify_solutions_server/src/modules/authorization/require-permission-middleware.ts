import type { NextFunction, Request, Response } from 'express'

import { roleHasPermission, type PermissionKey } from './permission-catalog.js'

export const requirePermission =
  (permission: PermissionKey) => (_request: Request, response: Response, next: NextFunction) => {
    const session = response.locals.session
    if (!roleHasPermission(session?.user?.role, permission)) {
      response.status(403).json({
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You do not have permission to perform this action.' },
      })
      return
    }
    next()
  }
