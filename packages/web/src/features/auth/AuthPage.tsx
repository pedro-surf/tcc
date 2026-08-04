import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import './AuthPage.css'

type Mode = 'login' | 'register'

type Props = {
  onAuthenticated?: () => void
}

export function AuthPage({ onAuthenticated }: Props) {
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [mode, setMode] = useState<Mode>('login')

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Checking session…</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <header className="auth-card__header">
            <h2>Signed in</h2>
            <p>
              Welcome back, <strong>{user.name}</strong>.
            </p>
          </header>
          <dl className="auth-card__profile">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{user.id}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="auth-page">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={onAuthenticated}
          onSwitchToRegister={() => setMode('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={onAuthenticated}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  )
}

export default AuthPage
