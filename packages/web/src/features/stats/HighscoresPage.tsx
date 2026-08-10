import { useGetLeaderboardsQuery } from '../../generated/graphql'
import './HighscoresPage.css'

type Entry = {
  rank: number
  score: number
  user: {
    id: string
    name: string
    location?: string | null
  }
}

function LeaderboardCard({
  title,
  hint,
  entries,
  unit,
}: {
  title: string
  hint: string
  entries: Entry[]
  unit: string
}) {
  return (
    <section className="highscores__card">
      <header>
        <h2>{title}</h2>
        <p>{hint}</p>
      </header>
      {entries.length === 0 ? (
        <p className="highscores__empty">No rankings yet.</p>
      ) : (
        <ol className="highscores__list">
          {entries.map((entry) => (
            <li key={`${title}-${entry.user.id}`}>
              <span className="highscores__rank">#{entry.rank}</span>
              <div className="highscores__user">
                <strong>{entry.user.name}</strong>
                {entry.user.location ? (
                  <span>{entry.user.location}</span>
                ) : null}
              </div>
              <span className="highscores__score">
                {entry.score} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function HighscoresPage() {
  const query = useGetLeaderboardsQuery({ take: 10 })
  const boards = query.data?.leaderboards

  return (
    <div className="highscores">
      <header className="highscores__header">
        <h1>Highscores</h1>
        <p>
          Community rankings for surf checks, sessions, marketplace activity,
          and more.
        </p>
      </header>

      {query.isLoading ? (
        <p>Loading rankings…</p>
      ) : query.isError ? (
        <p className="form-status form-status--error">
          {(query.error as Error).message || 'Failed to load leaderboards'}
        </p>
      ) : (
        <div className="highscores__grid">
          <LeaderboardCard
            title="Spot checks"
            hint="Most surf checks posted"
            entries={boards?.spotChecks ?? []}
            unit="checks"
          />
          <LeaderboardCard
            title="Sessions"
            hint="Most sessions logged"
            entries={boards?.sessions ?? []}
            unit="sessions"
          />
          <LeaderboardCard
            title="Marketplace"
            hint="Listings + sales + purchases"
            entries={boards?.marketplaceActivity ?? []}
            unit="actions"
          />
          <LeaderboardCard
            title="Spots created"
            hint="Breaks added to the map"
            entries={boards?.spotsCreated ?? []}
            unit="spots"
          />
          <LeaderboardCard
            title="Events"
            hint="Competitions / events created"
            entries={boards?.competitionsCreated ?? []}
            unit="events"
          />
          <LeaderboardCard
            title="Followers"
            hint="Most followed surfers"
            entries={boards?.followers ?? []}
            unit="followers"
          />
        </div>
      )}
    </div>
  )
}

export default HighscoresPage
