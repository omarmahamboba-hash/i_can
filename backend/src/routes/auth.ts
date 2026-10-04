import { Router } from 'express'
import {
  changePassword,
  checkPassword,
  clearSessionCookie,
  isAuthenticated,
  requireAuth,
  setSessionCookie,
} from '../auth'

const router = Router()

const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000
const MIN_PASSWORD_LENGTH = 4
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string): boolean {
  const bucket = attempts.get(key)
  if (!bucket) return false
  if (bucket.resetAt <= Date.now()) {
    attempts.delete(key)
    return false
  }
  return bucket.count >= MAX_ATTEMPTS
}

function recordFailure(key: string): void {
  const now = Date.now()
  if (attempts.size > 1000) {
    for (const [existing, bucket] of attempts) {
      if (bucket.resetAt <= now) attempts.delete(existing)
    }
  }
  const bucket = attempts.get(key)
  if (!bucket || bucket.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  else bucket.count += 1
}

router.post('/login', (req, res) => {
  const key = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  if (isRateLimited(key)) {
    res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)))
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!checkPassword(password)) {
    recordFailure(key)
    res.status(401).json({ error: 'invalid_password' })
    return
  }
  attempts.delete(key)
  setSessionCookie(res)
  res.json({ ok: true })
})

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', (req, res) => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ authenticated: false })
    return
  }
  res.json({ authenticated: true })
})

router.put('/password', requireAuth, (req, res) => {
  const current = typeof req.body?.current === 'string' ? req.body.current : ''
  const next = typeof req.body?.next === 'string' ? req.body.next : ''
  if (next.trim().length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: 'weak_password' })
    return
  }
  if (!changePassword(current, next)) {
    res.status(400).json({ error: 'invalid_password' })
    return
  }
  res.json({ ok: true })
})

export default router
