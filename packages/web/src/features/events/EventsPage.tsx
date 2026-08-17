import { Link } from 'react-router-dom'
import { HeatStatusEnum, useEventsQuery } from './api'
import './events.css'

export function EventsPage() {
  const eventsQuery = useEventsQuery({ take: 50 })
  const events = eventsQuery.data?.events ?? []

  return (
    <div className="events-page">
      <header className="events-page__header">
        <div>
          <h1>Events</h1>
          <p>
            Contest heats with a countdown, 1–5 judges, and live wave scoring.
          </p>
        </div>
      </header>

      <section className="events-page__section">
        {eventsQuery.isLoading ? (
          <p>Loading events…</p>
        ) : eventsQuery.isError ? (
          <p className="form-status form-status--error">
            {(eventsQuery.error as Error).message}
          </p>
        ) : events.length === 0 ? (
          <p>
            No events yet. Open a spot and use <strong>Add event</strong> to
            create one.
          </p>
        ) : (
          <ul className="event-list">
            {events.map((event) => {
              const live = event.heats.some(
                (heat) => heat.status === HeatStatusEnum.Running,
              )
              return (
                <li key={event.id}>
                  <Link to={`/events/${event.id}`} className="event-list__card">
                    <div>
                      <h2>{event.name}</h2>
                      <p>
                        {event.spot.name} ·{' '}
                        {new Date(event.date).toLocaleString()}
                      </p>
                      <p>
                        {event.heats.length} heat
                        {event.heats.length === 1 ? '' : 's'}
                        {live ? ' · live now' : ''}
                      </p>
                    </div>
                    <span className="btn btn-secondary">Open</span>
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

export default EventsPage
