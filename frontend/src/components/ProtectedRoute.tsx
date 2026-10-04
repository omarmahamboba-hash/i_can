import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AppDataProvider } from '../lib/store'
import AppShell from './AppShell'
import Icon from './Icon'

export default function ProtectedRoute() {
  const { authenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-white shadow-sm">
          <Icon name="check" className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    )
  }

  if (!authenticated) return <Navigate to="/login" replace />

  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  )
}
