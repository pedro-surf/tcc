import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

type NavItem = {
  to: string
  label: string
  end?: boolean
}

const GROUPS: NavItem[][] = [
  [
    { to: '/', label: 'Sessions', end: true },
    { to: '/live', label: 'Live' },
    { to: '/simulation', label: 'Simulation' },
  ],
  [
    { to: '/spots', label: 'Spots' },
    { to: '/checks', label: 'Checks' },
    { to: '/ranking', label: 'This week' },
  ],
  [
    { to: '/friends', label: 'Friends' },
    { to: '/events', label: 'Events' },
    { to: '/marketplace', label: 'Market' },
    { to: '/highscores', label: 'Scores' },
  ],
]

export function AppNav() {
  const { isAuthenticated } = useAuth()

  return (
    <nav className="app-nav" aria-label="Main">
      {GROUPS.map((group, index) => (
        <div className="app-nav__group" key={index}>
          {group.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-nav__item${isActive ? ' is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
      <div className="app-nav__group">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `app-nav__item${isActive ? ' is-active' : ''}`
          }
        >
          {isAuthenticated ? 'Account' : 'Sign in'}
        </NavLink>
      </div>
    </nav>
  )
}
