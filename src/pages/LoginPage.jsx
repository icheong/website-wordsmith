import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

/** Email + password entry for the seeded family accounts (no sign-up). */
export default function LoginPage() {
  const { signIn, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    const { error: signInError } = await signIn(email.trim(), password)
    setBusy(false)
    if (signInError) {
      const message = signInError.message ?? ''
      if (message === 'Invalid login credentials') {
        setError(
          'That email and password combination did not match an account.',
        )
      } else if (/api key/i.test(message)) {
        setError(
          'Supabase rejected the API key. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env — both must be copied from the same project (Supabase Dashboard → Project Settings → API keys).',
        )
      } else {
        setError(message)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-10 place-items-center rounded-lg bg-accent font-serif text-xl italic text-paper">
            W
          </span>
          <h1 className="font-serif text-2xl tracking-tight">WordSmith Studio</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            A quiet place to craft better sentences.
          </p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-lg border border-rule bg-paper-raised p-4 text-sm leading-relaxed text-ink-soft">
            <p className="mb-2 font-semibold text-ink">Supabase not configured</p>
            <p>
              Copy <code className="rounded bg-paper-deep px-1">.env.example</code>{' '}
              to{' '}
              <code className="rounded bg-paper-deep px-1">.env</code>, add your
              project URL and anon key, then run{' '}
              <code className="rounded bg-paper-deep px-1">supabase/schema.sql</code>{' '}
              and restart the dev server.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-rule bg-paper-raised p-6"
        >
          <label className="eyebrow block" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 mt-1.5 w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="you@example.com"
          />

          <label className="eyebrow block" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 mt-1.5 w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="••••••••"
          />

          {error && (
            <p className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !configured}
            className="btn btn-primary w-full justify-center"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Accounts are created by a parent — ask for your login details.
        </p>
      </div>
    </div>
  )
}
