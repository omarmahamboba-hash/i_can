import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useAppData } from '../lib/store'
import Icon, { type IconName } from './Icon'

const navItems: { to: string; key: string; icon: IconName; match: (path: string) => boolean }[] = [
  { to: '/home', key: 'nav.home', icon: 'home', match: (path: string) => path === '/home' },
  {
    to: '/vision',
    key: 'nav.vision',
    icon: 'layers',
    match: (path: string) => path.startsWith('/vision') || path.startsWith('/stages'),
  },
  { to: '/tech', key: 'nav.tech', icon: 'building', match: (path: string) => path.startsWith('/tech') },
]

export default function AppShell() {
  const { t, toggleLocale } = useI18n()
  const { logout } = useAuth()
  const { data, status, error, clearError, reload } = useAppData()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only-focusable fixed start-4 top-4 z-50 rounded-full bg-accent px-4 py-2 text-sm text-white"
      >
        {t('nav.skipToContent')}
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/home" className="group flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-white shadow-xs transition-transform duration-200 group-hover:-rotate-6">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-sm font-semibold tracking-[0.24em] text-ink">I CAN</span>
            </Link>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleLocale}
                aria-label={t('common.language')}
                title={t('common.language')}
                className="icon-btn"
              >
                <Icon name="globe" />
              </button>
              <Link to="/settings" aria-label={t('nav.settings')} title={t('nav.settings')} className="icon-btn">
                <Icon name="settings" />
              </Link>
              <button
                type="button"
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
                onClick={() => {
                  void logout().then(() => navigate('/login'))
                }}
                className="icon-btn"
              >
                <Icon name="logout" className="rtl:-scale-x-100" />
              </button>
            </div>
          </div>

          <nav
            aria-label={t('nav.menu')}
            className="-mx-1 flex items-center gap-1 overflow-x-auto pb-2 [scrollbar-width:none]"
          >
            {navItems.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-accent-soft font-semibold text-accent'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <span>{t('common.error')}</span>
            <button
              type="button"
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium underline underline-offset-4"
              onClick={clearError}
            >
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {!data && status === 'loading' ? (
          <div className="flex items-center gap-3 py-16 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
            {t('common.loading')}
          </div>
        ) : !data ? (
          <div className="empty">
            <p>{t('common.loadError')}</p>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => void reload()}>
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
