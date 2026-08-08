import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import ForecastTable from '../../ForecastTable'
import WindRose from '../../WindRose'
import '../../WindRose.css'
import { useAuth } from '../../auth/AuthContext'
import { mediaAbsoluteUrl } from '../../graphql/client'
import {
  useGetSpotQuery,
  useSpotChecksBySpotQuery,
  useSpotCompetitionsBySpotQuery,
  useSpotForecastsBySpotQuery,
} from '../../generated/graphql'
import { CreateSpotCheck } from '../spotChecks/CreateSpotCheck'
import { CreateSpotCompetition } from './CreateSpotCompetition'
import './SpotDetailsPage.css'

type TimelineItem =
  | {
      kind: 'check'
      id: string
      at: number
      title: string
      body: string
      score?: number
      mediaUrl?: string
      mediaType?: string
    }
  | {
      kind: 'event'
      id: string
      at: number
      title: string
      body: string
    }

export function SpotDetailsPage() {
  const { spotId = '' } = useParams()
  const { isAuthenticated } = useAuth()
  const [panel, setPanel] = useState<'none' | 'check' | 'event'>('none')

  const spotQuery = useGetSpotQuery(
    { id: spotId },
    { enabled: Boolean(spotId) },
  )
  const forecastsQuery = useSpotForecastsBySpotQuery(
    { spotId, take: 24 },
    { enabled: Boolean(spotId) },
  )
  const checksQuery = useSpotChecksBySpotQuery(
    { spotId, take: 50 },
    { enabled: Boolean(spotId) },
  )
  const compsQuery = useSpotCompetitionsBySpotQuery(
    { spotId, take: 50 },
    { enabled: Boolean(spotId) },
  )

  const spot = spotQuery.data?.spot

  const timeline = useMemo(() => {
    const items: TimelineItem[] = []
    for (const check of checksQuery.data?.spotChecksBySpot ?? []) {
      const media = check.media[0]
      items.push({
        kind: 'check',
        id: check.id,
        at: new Date(check.timestamp).getTime(),
        title: 'Surf check',
        body: check.description,
        score: check.score,
        mediaUrl: media ? mediaAbsoluteUrl(media.mediaUrl) : undefined,
        mediaType: media?.mediaType,
      })
    }
    for (const event of compsQuery.data?.spotCompetitionsBySpot ?? []) {
      items.push({
        kind: 'event',
        id: event.id,
        at: new Date(event.date).getTime(),
        title: event.name,
        body: event.description || 'Competition / event',
      })
    }
    return items.sort((a, b) => b.at - a.at)
  }, [checksQuery.data?.spotChecksBySpot, compsQuery.data?.spotCompetitionsBySpot])

  const forecastRows = useMemo(
    () =>
      (forecastsQuery.data?.spotForecastsBySpot ?? []).map((f) => ({
        ideal: f.ideal,
        score: f.score ?? undefined,
        userId: '',
        swell: f.swell,
        swellDir: f.swellDir,
        period: f.period ?? undefined,
        wind: f.wind,
        windDir: f.windDir,
        energy: f.energy ?? undefined,
        gust: f.gust ?? undefined,
        power: f.power ?? undefined,
        timestamp: new Date(f.timestamp ?? Date.now()),
      })),
    [forecastsQuery.data?.spotForecastsBySpot],
  )

  if (spotQuery.isLoading) {
    return <div className="spot-details">Loading spot…</div>
  }

  if (!spot) {
    return (
      <div className="spot-details">
        <p>Spot not found.</p>
        <Link to="/">Back home</Link>
      </div>
    )
  }

  return (
    <div className="spot-details">
      <header className="spot-details__header">
        <div>
          <Link to="/" className="spot-details__back">
            ← Spots
          </Link>
          <h1>{spot.name}</h1>
          <p className="spot-details__meta">
            {spot.country.replaceAll('_', ' ')} ·{' '}
            {spot.waveType.replaceAll('_', ' ')} ·{' '}
            {spot.bottomType.replaceAll('_', ' ')}
            {spot.difficulty ? ` · ${spot.difficulty}` : ''}
          </p>
        </div>
        <div className="spot-details__actions">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPanel(panel === 'check' ? 'none' : 'check')}
              >
                Surf check
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPanel(panel === 'event' ? 'none' : 'event')}
              >
                Add event
              </button>
            </>
          ) : (
            <Link to="/" className="btn btn-secondary">
              Sign in to contribute
            </Link>
          )}
          {spot.mapsUrl ? (
            <a
              className="btn btn-secondary"
              href={spot.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Map
            </a>
          ) : null}
        </div>
      </header>

      <section className="spot-details__section">
        <h2>Description</h2>
        <p>{spot.description?.trim() || 'No description yet.'}</p>
      </section>

      <section className="spot-details__section spot-details__dirs">
        <h2>Ideal directions</h2>
        <div className="spot-details__roses">
          <WindRose
            label="Ideal wind"
            size={140}
            value={spot.idealWindDir ?? 0}
          />
          <WindRose
            label="Ideal swell"
            size={140}
            value={spot.idealSwellDir ?? 180}
          />
        </div>
      </section>

      <section className="spot-details__section">
        <h2>Forecast</h2>
        <p className="spot-details__hint">
          Ranked forecast for this break (from stored / vector-backed forecasts).
        </p>
        {forecastsQuery.isLoading ? (
          <p>Loading forecast…</p>
        ) : forecastRows.length === 0 ? (
          <p>No forecast rows for this spot yet.</p>
        ) : (
          <ForecastTable data={forecastRows} />
        )}
      </section>

      {panel === 'check' ? (
        <section className="spot-details__section">
          <CreateSpotCheck
            defaultSpotId={spot.id}
            onCancel={() => setPanel('none')}
            onCreated={() => {
              setPanel('none')
              void checksQuery.refetch()
            }}
          />
        </section>
      ) : null}

      {panel === 'event' ? (
        <section className="spot-details__section">
          <CreateSpotCompetition
            spotId={spot.id}
            onCreated={() => {
              setPanel('none')
              void compsQuery.refetch()
            }}
          />
        </section>
      ) : null}

      <section className="spot-details__section">
        <h2>Timeline</h2>
        {timeline.length === 0 ? (
          <p>No checks or events yet.</p>
        ) : (
          <ol className="spot-timeline">
            {timeline.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="spot-timeline__item">
                <div className="spot-timeline__rail" />
                <div className="spot-timeline__card">
                  <div className="spot-timeline__when">
                    {new Date(item.at).toLocaleString()}
                    <span className={`spot-timeline__tag spot-timeline__tag--${item.kind}`}>
                      {item.kind === 'check' ? 'Check' : 'Event'}
                    </span>
                  </div>
                  <h3>
                    {item.title}
                    {item.kind === 'check' && item.score != null
                      ? ` · ${item.score.toFixed(1)}/10`
                      : ''}
                  </h3>
                  <p>{item.body}</p>
                  {item.kind === 'check' && item.mediaUrl ? (
                    item.mediaType === 'VIDEO' ? (
                      <video
                        className="spot-timeline__media"
                        src={item.mediaUrl}
                        controls
                      />
                    ) : (
                      <img
                        className="spot-timeline__media"
                        src={item.mediaUrl}
                        alt=""
                      />
                    )
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default SpotDetailsPage
