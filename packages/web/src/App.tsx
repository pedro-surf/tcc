import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './index.css'
import SessionDetail from './SessionDetails'
import type { Session } from './types'
import { loadCbor } from './utils/loadCbor'
import { fakeSessions } from './utils/fakeSessions'
import { SpotsPage } from './features/spots/SpotsPage'
import { SpotChecksPage } from './features/spotChecks/SpotChecksPage'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './auth/AuthContext'

type AppView = 'sessions' | 'spots' | 'checks' | 'account' | 'friends'

type Props = {
  children?: ReactNode
}

function App({ children }: Props) {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState<AppView>('sessions')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [secondSelectedSession, setSecondSelectedSession] =
    useState<Session | null>(null)
  const [mode, setMode] = useState<'compare' | 'single'>('single')

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const {
      data: samples,
      results,
      intervalMs,
      manuevers,
      predictions,
    } = await loadCbor(file)
    const payload = {
      id: `Imported-${file.name}`,
      samples,
      results,
      intervalMs,
      manuevers,
      predictions,
    }
    if (samples?.length) {
      if (selectedSession) {
        setSecondSelectedSession(payload)
      } else {
        setSelectedSession(payload)
      }
    }
  }

  const handleSelectSession = (s: Session) => {
    if (selectedSession) {
      setSecondSelectedSession(s)
      return
    }
    setSelectedSession(s)
  }

  const handleClear = () => {
    setSelectedSession(null)
    setSecondSelectedSession(null)
  }

  const hideInputs =
    (mode === 'single' && selectedSession) ||
    (mode === 'compare' && selectedSession && secondSelectedSession)

  return (
    <div className="app">
      <header className="app-header">
        <h2 className="app-brand" onClick={handleClear}>
          Surf Log
        </h2>
        <nav className="app-nav">
          <button
            type="button"
            className={`app-nav__btn${
              !children && view === 'sessions' ? ' is-active' : ''
            }`}
            onClick={() => {
              navigate('/')
              setView('sessions')
            }}
          >
            Sessions
          </button>
          <button
            type="button"
            className={`app-nav__btn${
              !children && view === 'spots' ? ' is-active' : ''
            }`}
            onClick={() => {
              navigate('/')
              setView('spots')
            }}
          >
            Spots
          </button>
          <button
            type="button"
            className={`app-nav__btn${
              !children && view === 'checks' ? ' is-active' : ''
            }`}
            onClick={() => {
              navigate('/')
              setView('checks')
            }}
          >
            Spot checks
          </button>
          <Link
            to="/friends"
            className={`app-nav__btn app-nav__link${
              location.pathname.startsWith('/friends') ? ' is-active' : ''
            }`}
          >
            Friends
          </Link>
          <Link
            to="/marketplace"
            className={`app-nav__btn app-nav__link${
              location.pathname.startsWith('/marketplace') ? ' is-active' : ''
            }`}
          >
            Marketplace
          </Link>
          <Link
            to="/highscores"
            className={`app-nav__btn app-nav__link${
              location.pathname.startsWith('/highscores') ? ' is-active' : ''
            }`}
          >
            Highscores
          </Link>
          <button
            type="button"
            className={`app-nav__btn${
              !children && view === 'account' ? ' is-active' : ''
            }`}
            onClick={() => {
              navigate('/')
              setView('account')
            }}
          >
            {isAuthenticated ? 'Account' : 'Sign in'}
          </button>
          <Link to="/simulation" className="app-nav__btn app-nav__link">
            Simulation
          </Link>
        </nav>
        {isAuthenticated && user ? (
          <div className="app-user">
            <span className="app-meta">{user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : null}
        {view === 'sessions' && selectedSession && mode === 'single' && (
          <span className="app-meta">
            Session {selectedSession.id} - {selectedSession.samples.length}{' '}
            samples
          </span>
        )}
      </header>

      {children ? (
        children
      ) : view === 'account' ? (
        <AuthPage onAuthenticated={() => setView('checks')} />
      ) : view === 'spots' ? (
        <SpotsPage onRequireAuth={() => setView('account')} />
      ) : view === 'checks' ? (
        <SpotChecksPage onRequireAuth={() => setView('account')} />
      ) : (
        <>
          {!hideInputs && (
            <>
              <div className="d-flex flex-clmn">
                <h2>Import CBOR file</h2>
                <div>
                  <input
                    type="file"
                    accept=".cbor"
                    onChange={handleImportFile}
                  />
                </div>
              </div>
              <div className="d-flex flex-clmn">
                <h2>Mock sessions</h2>
                {fakeSessions.map((s) => (
                  <button
                    className="mb-2"
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                  >
                    {s.id} ({s.samples.length} amostras)
                  </button>
                ))}
                <div className="d-flex flex-clmn">
                  <select
                    value={mode}
                    onChange={(sel) =>
                      setMode(sel.target.value as 'single' | 'compare')
                    }
                  >
                    <option value="compare">Compare sample pair</option>
                    <option value="single">Analyse single sample</option>
                  </select>
                  {mode === 'compare' &&
                  !secondSelectedSession &&
                  selectedSession
                    ? 'Sample 1 ok. Select Sample 2'
                    : ''}
                </div>
              </div>
            </>
          )}

          {mode === 'single' && selectedSession && (
            <SessionDetail session={selectedSession} />
          )}
          {mode === 'compare' && selectedSession && secondSelectedSession && (
            <div className="d-flex">
              <SessionDetail
                hideManuevers
                hideReplay
                hideTimeline
                session={selectedSession}
              />
              <SessionDetail
                hideManuevers
                hideReplay
                hideTimeline
                session={secondSelectedSession}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
