import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './index.css'
import { useAuth } from './auth/AuthContext'
import { AppNav } from './components/layout/AppNav'

type Props = {
  children?: ReactNode
}

function App({ children }: Props) {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-brand">
          Surf Log
        </Link>
        <AppNav />
        {isAuthenticated && user ? (
          <div className="app-user">
            <span className="app-meta">{user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>
      <div className="app-main">{children}</div>
    </div>
  )
}

export default App
