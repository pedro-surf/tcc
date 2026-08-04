import { useState } from 'react'
import { CreateSpot } from './CreateSpot'
import { SpotsList } from './SpotsList'
import './SpotsPage.css'

type View = 'list' | 'create'

export function SpotsPage() {
  const [view, setView] = useState<View>('list')
  const [listKey, setListKey] = useState(0)

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
            onClick={() => setView('create')}
          >
            New spot
          </button>
        }
      />
    </div>
  )
}

export default SpotsPage
