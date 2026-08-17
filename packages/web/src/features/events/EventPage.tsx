import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { CreateHeatForm } from './CreateHeatForm'
import { HeatStatusEnum, useSpotCompetitionQuery } from './api'
import { formatClock } from './heatUtils'
import './events.css'

export function EventPage() {
  const { eventId = '' } = useParams()
  const { isAuthenticated } = useAuth()
  const [showHeatForm, setShowHeatForm] = useState(false)
  const eventQuery = useSpotCompetitionQuery(
    { id: eventId },
    { enabled: Boolean(eventId) },
  )
  const event = eventQuery.data?.spotCompetition

  if (eventQuery.isLoading) {
    return <div className="events-page">Loading event…</div>
  }

  if (!event) {
    return (
      <div className="events-page">
        <p>Event not found.</p>
        <Link to="/events">Back to events</Link>
      </div>
    )
  }

  return (
    <div className="events-page">
      <header className="events-page__header">
        <div>
          <Link to={`/spots/${event.spotId}`} className="spot-details__back">
            ← {event.spot.name}
          </Link>
          <h1>{event.name}</h1>
          <p>
            {new Date(event.date).toLocaleString()}
            {event.description ? ` · ${event.description}` : ''}
          </p>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowHeatForm((open) => !open)}
          >
            {showHeatForm ? 'Close' : 'Add heat'}
          </button>
        ) : (
          <Link to="/" className="btn btn-secondary">
            Sign in to run heats
          </Link>
        )}
      </header>

      {showHeatForm ? (
        <section className="events-page__section">
          <CreateHeatForm
            competitionId={event.id}
            defaultName={`Heat ${event.heats.length + 1}`}
            onCreated={() => setShowHeatForm(false)}
          />
        </section>
      ) : null}

      <section className="events-page__section">
        <h2>Heats</h2>
        {event.heats.length === 0 ? (
          <p>No heats yet. Add surfers, judges, and a duration to start judging.</p>
        ) : (
          <ul className="heat-list">
            {event.heats.map((heat) => {
              const leader = [...heat.surfers].sort(
                (a, b) => b.heatTotal - a.heatTotal,
              )[0]
              return (
                <li key={heat.id} className="heat-list__card">
                  <div>
                    <h3>{heat.name}</h3>
                    <p>
                      {heat.durationMin} min · {heat.judgeCount} judge
                      {heat.judgeCount === 1 ? '' : 's'} ·{' '}
                      {heat.surfers.map((surfer) => surfer.user.name).join(', ')}
                    </p>
                    <span className={`heat-status heat-status--${heat.status.toLowerCase()}`}>
                      {statusLabel(heat.status)}
                      {heat.status === HeatStatusEnum.Running
                        ? ` · ${formatClock(heat.remainingSec)} left`
                        : ''}
                    </span>
                    {leader && heat.status !== HeatStatusEnum.Pending ? (
                      <p>
                        Leader {leader.user.name} · {leader.heatTotal.toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    className="btn btn-primary"
                    to={`/events/${event.id}/heats/${heat.id}`}
                  >
                    {heat.status === HeatStatusEnum.Pending
                      ? 'Open judging'
                      : heat.status === HeatStatusEnum.Running
                        ? 'Continue heat'
                        : 'View results'}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function statusLabel(status: string) {
  if (status === HeatStatusEnum.Running) return 'Live'
  if (status === HeatStatusEnum.Finished) return 'Finished'
  return 'Ready'
}

export default EventPage
