import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { CreateSpot } from './CreateSpot'
import { SpotsList } from './SpotsList'
import './SpotsPage.css'

type View = 'list' | 'create'

export function SpotsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('list')
  const [listKey, setListKey] = useState(0)

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      navigate('/account')
      return
    }
    setView('create')
  }

  if (view === 'create') {
    return (
      <div className="spots-page">
        <CreateSpot
          onCancel={() => setView('list')}
          onCreated={() => {
            setListKey((key) => key + 1)
            setView('list')
          }}
        />
      </div>
    )
  }

  return (
    <div className="spots-page">
      <SpotsList
        key={listKey}
        toolbar={
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateClick}
          >
            {isAuthenticated ? 'New spot' : 'Sign in to create'}
          </button>
        }
      />
    </div>
  )
}

export default SpotsPage
