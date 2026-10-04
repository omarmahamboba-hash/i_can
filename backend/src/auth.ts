import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { getSetting, setSetting } from './db'

const COOKIE_NAME = 'ican_session'
const SESSION_DAYS = 30
const SCRYPT_PREFIX = 'scrypt'
const DEFAULT_PASSWORD = 'ican'

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64)
  return `${SCRYPT_PREFIX}:${salt.toString('hex')}:${key.toString('hex')}`
}

function verifyHash(password: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split(':')
  if (scheme !== SCRYPT_PREFIX || !saltHex || !keyHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(keyHex, 'hex')
  const actual = crypto.scryptSync(password, salt, expected.length)
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

/**
 * The password lives in the database once initialised. ICAN_PASSWORD only seeds
 * it on first run; afterwards the value stored in the app is the source of truth.
 */
export function ensurePasswordInitialized(): void {
  if (getSetting('password_hash')) return
  const initial = process.env.ICAN_PASSWORD
  if (!initial && process.env.NODE_ENV === 'production') {
    throw new Error('ICAN_PASSWORD must be set on first run in production.')
  }
  if (!initial) {
    console.warn('[I CAN] ICAN_PASSWORD is not set — the default password "ican" is in use.')
  }
  setSetting('password_hash', hashPassword(initial && initial.length > 0 ? initial : DEFAULT_PASSWORD))
}

export function checkPassword(candidate: string): boolean {
  const stored = getSetting('password_hash')
  if (!stored) return false
  return verifyHash(candidate ?? '', stored)
}

export function changePassword(current: string, next: string): boolean {
  if (!checkPassword(current)) return false
  setSetting('password_hash', hashPassword(next))
  return true
}

function getSecret(): string {
  let secret = getSetting('session_secret')
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex')
    setSetting('session_secret', secret)
  }
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

function createToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = `${expires}.${crypto.randomBytes(12).toString('hex')}`
  return `${payload}.${sign(payload)}`
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false
  const lastDot = token.lastIndexOf('.')
  if (lastDot < 0) return false
  const payload = token.slice(0, lastDot)
  const signature = token.slice(lastDot + 1)
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!crypto.timingSafeEqual(a, b)) return false

  const expires = Number(payload.split('.')[0])
  return Number.isFinite(expires) && expires > Date.now()
}

export function setSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production'
  res.cookie(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function isAuthenticated(req: Request): boolean {
  return verifyToken(req.cookies?.[COOKIE_NAME])
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
