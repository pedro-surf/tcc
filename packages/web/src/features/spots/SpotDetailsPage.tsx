import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import ForecastTable from '../../ForecastTable'
import WindRose from '../../WindRose'
import '../../WindRose.css'
import { useAuth } from '../../auth/AuthContext'
import { mediaAbsoluteUrl } from '../../graphql/client'
import {
  useGenerateSpotWeeklyDescriptionMutation,
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
  const [aiError, setAiError] = useState<string | null>(null)

  const spotQuery = useGetSpotQuery(
    { id: spotId },
    { enabled: Boolean(spotId) },
  )
  const generateWeekly = useGenerateSpotWeeklyDescriptionMutation({
    onSuccess: async () => {
      setAiError(null)
      await spotQuery.refetch()
    },
    onError: (error) => {
      setAiError(
        error instanceof Error
          ? error.message
          : 'Failed to generate weekly description',
      )
    },
  })
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

  const heroMedia = useMemo(() => {
    const linked = (spot?.media ?? []).find((m) => m.mediaType === 'IMAGE')
      ?? (spot?.media ?? [])[0]
    if (linked) {
      return {
        url: mediaAbsoluteUrl(linked.mediaUrl),
        mediaType: linked.mediaType,
        source: 'spot' as const,
      }
    }

    for (const check of checksQuery.data?.spotChecksBySpot ?? []) {
      const fromCheck =
        check.media.find((m) => m.mediaType === 'IMAGE') ?? check.media[0]
      if (fromCheck) {
        return {
          url: mediaAbsoluteUrl(fromCheck.mediaUrl),
          mediaType: fromCheck.mediaType,
          source: 'check' as const,
        }
      }
    }
    return null
  }, [spot?.media, checksQuery.data?.spotChecksBySpot])

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
            {spot.secret ? ' · Secret' : ''}
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

      <section className="spot-details__section spot-details__about">
        <div className="spot-details__about-text">
          <h2>Description</h2>
          <p>{spot.description?.trim() || 'No description yet.'}</p>
          <div className="spot-details__tolerances">
            <div>
              <span>Strong swell tolerance</span>
              <strong>
                {spot.strongSwellTolerance != null
                  ? `${spot.strongSwellTolerance}/5`
                  : '—'}
              </strong>
            </div>
            <div>
              <span>Strong wind tolerance</span>
              <strong>
                {spot.strongWindTolerance != null
                  ? `${spot.strongWindTolerance}/5`
                  : '—'}
              </strong>
            </div>
          </div>
        </div>
        <div className="spot-details__hero-media">
          {heroMedia ? (
            <>
              {heroMedia.mediaType === 'VIDEO' ? (
                <video src={heroMedia.url} controls />
              ) : (
                <img src={heroMedia.url} alt={`${spot.name} media`} />
              )}
              {heroMedia.source === 'check' ? (
                <p className="spot-details__media-caption">
                  From a recent surf check
                </p>
              ) : null}
            </>
          ) : (
            <div className="spot-details__hero-placeholder">
              No spot image yet
            </div>
          )}
        </div>
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
        <div className="spot-details__weekly-head">
          <div>
            <h2>Weekly AI outlook</h2>
            <p className="spot-details__hint">
              Combines forecast rows with ideal directions and strong
              wind/swell tolerance. Regenerates at most once per week.
            </p>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !spot.canGenerateWeeklyDescription || generateWeekly.isPending
              }
              onClick={() => {
                setAiError(null)
                generateWeekly.mutate({ spotId: spot.id })
              }}
            >
              {generateWeekly.isPending
                ? 'Generating…'
                : spot.canGenerateWeeklyDescription
                  ? 'Generate with AI'
                  : 'Available in a week'}
            </button>
          ) : (
            <Link to="/" className="btn btn-secondary">
              Sign in to generate
            </Link>
          )}
        </div>
        {spot.weeklyGeneratedAt ? (
          <p className="spot-details__media-caption">
            Last generated{' '}
            {new Date(spot.weeklyGeneratedAt).toLocaleString()}
          </p>
        ) : null}
        {spot.weeklyGeneratedDescription?.trim() ? (
          <p className="spot-details__weekly-body">
            {spot.weeklyGeneratedDescription}
          </p>
        ) : (
          <p>No weekly AI description yet.</p>
        )}
        {aiError ? (
          <p className="form-status form-status--error">{aiError}</p>
        ) : null}

        {(spot.weeklyDescriptions?.length ?? 0) > 1 ? (
          <div className="spot-details__weekly-history">
            <h3>Previous weeks</h3>
            <ul>
              {spot.weeklyDescriptions
                .filter(
                  (item) =>
                    item.description !== spot.weeklyGeneratedDescription ||
                    new Date(item.generatedAt).getTime() !==
                      new Date(spot.weeklyGeneratedAt ?? 0).getTime(),
                )
                .map((item) => (
                  <li key={item.id}>
                    <div className="spot-details__weekly-history-meta">
                      Week of{' '}
                      {new Date(item.weekStart).toLocaleDateString()}
                      {' · '}
                      {new Date(item.generatedAt).toLocaleString()}
                      {item.primaryForecast ? (
                        <>
                          {' · '}forecast{' '}
                          {item.primaryForecast.swell}m swell /{' '}
                          {item.primaryForecast.wind} wind
                          {item.primaryForecast.ideal ? ' · ideal' : ''}
                        </>
                      ) : null}
                    </div>
                    <p>{item.description}</p>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
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
