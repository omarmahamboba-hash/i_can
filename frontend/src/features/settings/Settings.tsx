import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import Icon from '../../components/Icon'

type ErrorKey = 'current' | 'length' | 'mismatch' | 'unknown'

const MIN_LENGTH = 4

export default function Settings() {
  const { t } = useI18n()
  const { changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  function reset() {
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setDone(false)
    if (next.trim().length < MIN_LENGTH) {
      setError('length')
      return
    }
    if (next !== confirm) {
      setError('mismatch')
      return
    }
    setBusy(true)
    try {
      const result = await changePassword(current, next)
      if (result === 'ok') {
        setError(null)
        setDone(true)
        reset()
      } else {
        setError(result === 'weak' ? 'length' : 'current')
      }
    } catch {
      setError('unknown')
    } finally {
      setBusy(false)
    }
  }

  const errorText =
    error === 'current'
      ? t('settings.error.current')
      : error === 'length'
        ? t('settings.error.length')
        : error === 'mismatch'
          ? t('settings.error.mismatch')
          : error === 'unknown'
            ? t('common.error')
            : null

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.subtitle')}</p>
      </header>

      <section className="card p-6">
        <div className="flex items-start gap-3">
          <span className="icon-tile">
            <Icon name="lock" />
          </span>
          <div>
            <h2 className="section-title">{t('settings.passwordTitle')}</h2>
            <p className="mt-0.5 text-sm text-muted">{t('settings.passwordHint')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 max-w-sm space-y-4">
          <div>
            <label htmlFor="current-password" className="field-label">
              {t('settings.current')}
            </label>
            <input
              id="current-password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={current}
              onChange={(event) => {
                setCurrent(event.target.value)
                setError(null)
                setDone(false)
              }}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="field-label">
              {t('settings.new')}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={next}
                aria-describedby={errorText ? 'password-error' : undefined}
                onChange={(event) => {
                  setNext(event.target.value)
                  setError(null)
                  setDone(false)
                }}
                className="input pe-11"
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                aria-label={show ? t('settings.hide') : t('settings.show')}
                title={show ? t('settings.hide') : t('settings.show')}
                className="icon-btn icon-btn-sm absolute end-1 top-1/2 -translate-y-1/2"
              >
                <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="field-label">
              {t('settings.confirm')}
            </label>
            <input
              id="confirm-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              aria-describedby={errorText ? 'password-error' : undefined}
              onChange={(event) => {
                setConfirm(event.target.value)
                setError(null)
                setDone(false)
              }}
              className="input"
            />
          </div>

          {errorText && (
            <p id="password-error" role="alert" className="text-xs text-danger">
              {errorText}
            </p>
          )}
          {done && (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-done">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
              {t('settings.changed')}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? t('common.saving') : t('settings.changePassword')}
          </button>
        </form>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="section-title">{t('settings.logoutTitle')}</h2>
          <p className="mt-0.5 text-sm text-muted">{t('settings.logoutHint')}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost gap-2"
          onClick={() => {
            void logout().then(() => navigate('/login'))
          }}
        >
          <Icon name="logout" className="rtl:-scale-x-100" />
          {t('settings.logout')}
        </button>
      </section>
    </div>
  )
}
