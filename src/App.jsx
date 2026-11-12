import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { StudioProvider } from './context/StudioContext'
import Shell from './components/Shell'
import LoginPage from './pages/LoginPage'

/** Chooses between the login screen and the studio shell. */
function Root() {
  const { user, loading, configured } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-faint">
        Loading studio…
      </div>
    )
  }

  // No credentials configured (dev setup) or signed out → login screen.
  if (!configured || !user) return <LoginPage />

  return (
    <StudioProvider>
      <Shell />
    </StudioProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ToastProvider>
  )
}
