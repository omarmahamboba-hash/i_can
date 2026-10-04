import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'

export default function Login() {
  const { t } = useI18n()
  const { authenticated, login } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authenticated) navigate('/home', { replace: true })
  }, [authenticated, navigate])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(false)
    let ok = false
    try {
      ok = await login(password)
    } catch {
      ok = false
    }
    setBusy(false)
    if (ok) navigate('/home', { replace: true })
    else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white shadow-md">
            <Icon name="check" className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">I CAN</h1>
          <p className="mt-2 text-sm text-muted">{t('auth.subtitle')}</p>
        </div>

        <form onSubmit={onSubmit} className="surface p-6">
          <label htmlFor="password" className="field-label">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              value={password}
              aria-invalid={error}
              aria-describedby={error ? 'password-error' : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(false)
              }}
              className={`input pe-11 ${error ? 'border-danger' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? t('settings.hide') : t('settings.show')}
              className="icon-btn icon-btn-sm absolute end-1 top-1/2 -translate-y-1/2"
            >
              <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <p id="password-error" role="alert" className="mt-3 text-xs text-danger">
              {t('auth.error')}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
            {busy ? t('common.loading') : t('auth.enter')}
          </button>
        </form>
      </div>
    </div>
  )
}
