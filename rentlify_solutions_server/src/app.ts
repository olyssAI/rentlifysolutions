import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { toNodeHandler } from 'better-auth/node'
import { pinoHttp } from 'pino-http'

import { environment } from './config/environment.js'
import { authentication, customerAuthentication } from './modules/authentication/authentication.js'
import { authenticationRouter } from './modules/authentication/authentication-routes.js'
import { healthRouter } from './modules/health/health-routes.js'
import { errorHandler, notFoundHandler } from './modules/http/error-handlers.js'
import { restaurantRouter } from './modules/restaurants/restaurant-routes.js'
import { restaurantOwnerRouter } from './modules/restaurant-owners/restaurant-owner-routes.js'
import { publicCatalogRouter } from './modules/public-catalog/public-catalog-routes.js'
import { orderRouter } from './modules/orders/order-routes.js'
import { contactEnquiryRouter } from './modules/contact-enquiries/contact-enquiry-routes.js'

export const createApplication = (): express.Express => {
  const application = express()
  const operationalApplicationCors = cors({
    origin: environment.FRONTEND_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key'],
  })
  const marketingContactCors = cors({
    origin: environment.MARKETING_SITE_ORIGINS,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  application.disable('x-powered-by')
  // Trust forwarded headers only from the proxies that are explicitly configured. A hop
  // count would trust whatever sent the request, letting a client spoof its own address.
  // Better Auth resolves the client IP separately; see advanced.ipAddress in authentication.ts.
  application.set('trust proxy', environment.TRUSTED_PROXY_IPS.length > 0 ? environment.TRUSTED_PROXY_IPS : false)
  application.use(
    pinoHttp({
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
    }),
  )
  application.use(helmet())
  application.use((request, response, next) => {
    const selectedCors = request.path.startsWith('/api/public/contact')
      ? marketingContactCors
      : operationalApplicationCors
    selectedCors(request, response, next)
  })
  application.all('/api/auth/*splat', toNodeHandler(authentication))
  application.all('/api/customer-auth/*splat', toNodeHandler(customerAuthentication))
  application.use(express.json({ limit: '1mb' }))

  application.get('/', (_request, response) => {
    response.status(200).json({
      success: true,
      data: {
        message: `Rentlify Solutions server is running on port ${environment.PORT}.`,
      },
    })
  })

  application.use('/health', healthRouter)
  application.use('/api/authenticated', authenticationRouter)
  application.use('/api/public/restaurants', publicCatalogRouter)
  application.use('/api/public/contact', contactEnquiryRouter)
  application.use('/api/customer', orderRouter)
  application.use('/api/admin/restaurants', restaurantRouter)
  application.use('/api/owner', restaurantOwnerRouter)

  application.use(notFoundHandler)
  application.use(errorHandler)

  return application
}
