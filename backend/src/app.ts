import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { requireAuth, ensurePasswordInitialized } from './auth'
import { seed } from './seed'
import authRoutes from './routes/auth'
import stateRoutes from './routes/state'
import stageRoutes from './routes/stages'
import goalRoutes from './routes/goals'
import stepRoutes from './routes/steps'
import resourceRoutes from './routes/resources'
import companyRoutes from './routes/companies'

export function createApp() {
  seed()
  ensurePasswordInitialized()

  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'same-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'",
    )
    next()
  })
  app.use(express.json({ limit: '256kb' }))
  app.use(cookieParser())

  app.use('/api/auth', authRoutes)
  app.use('/api', requireAuth)
  app.use('/api', stateRoutes)
  app.use('/api/stages', stageRoutes)
  app.use('/api/goals', goalRoutes)
  app.use('/api/steps', stepRoutes)
  app.use('/api/resources', resourceRoutes)
  app.use('/api/companies', companyRoutes)

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not_found' })
  })

  const clientDir = path.resolve(__dirname, '../../frontend/dist')
  if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir))
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'))
    })
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err)
    if (res.headersSent) {
      next(err)
      return
    }
    res.status(500).json({ error: 'server_error' })
  })

  return app
}
