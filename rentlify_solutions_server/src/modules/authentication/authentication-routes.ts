import { Router } from 'express'

import { requireSuperAdministrator } from './authentication-middleware.js'

export const authenticationRouter = Router()

authenticationRouter.get('/session', requireSuperAdministrator, (_request, response) => {
  response.status(200).json({ success: true, data: response.locals.session })
})
