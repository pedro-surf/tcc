import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  useFollowUserMutation,
  useGetUsersQuery,
  useMyFriendsQuery,
  useUnfollowUserMutation,
} from '../../generated/graphql'
import './FriendsPage.css'

export function FriendsPage() {
  const { isAuthenticated, user } = useAuth()
  const [search, setSearch] = useState('')
  const friendsQuery = useMyFriendsQuery(undefined, {
    enabled: isAuthenticated,
  })
  const usersQuery = useGetUsersQuery(
    { take: 50, skip: 0, name: search.trim() || undefined },
    { enabled: isAuthenticated },
  )
  const follow = useFollowUserMutation({
    onSuccess: () => {
      void friendsQuery.refetch()
    },
  })
  const unfollow = useUnfollowUserMutation({
    onSuccess: () => {
      void friendsQuery.refetch()
    },
  })

  const friendIds = useMemo(
    () => new Set((friendsQuery.data?.myFriends ?? []).map((f) => f.id)),
    [friendsQuery.data?.myFriends],
  )

  if (!isAuthenticated) {
    return (
      <div className="friends-page">
        <h1>Friends</h1>
        <p>Sign in to follow other surfers.</p>
        <Link to="/">Go sign in</Link>
      </div>
    )
  }

  return (
    <div className="friends-page">
      <header>
        <h1>Friends</h1>
        <p>Follow people to share sessions, checks, and events.</p>
      </header>

      <section className="friends-page__section">
        <h2>Following ({friendsQuery.data?.myFriends.length ?? 0})</h2>
        {(friendsQuery.data?.myFriends.length ?? 0) === 0 ? (
          <p>You are not following anyone yet.</p>
        ) : (
          <ul className="friends-page__list">
            {friendsQuery.data?.myFriends.map((friend) => (
              <li key={friend.id}>
                <div>
                  <strong>{friend.name}</strong>
                  <span>{friend.email}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => unfollow.mutate({ userId: friend.id })}
                >
                  Unfollow
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="friends-page__section">
        <h2>Find people</h2>
        <input
          className="friends-page__search"
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="friends-page__list">
          {(usersQuery.data?.users ?? [])
            .filter((u) => u.id !== user?.id)
            .map((candidate) => {
              const isFriend = friendIds.has(candidate.id)
              return (
                <li key={candidate.id}>
                  <div>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.email}</span>
                  </div>
                  <button
                    type="button"
                    className={isFriend ? 'btn btn-secondary' : 'btn btn-primary'}
                    onClick={() =>
                      isFriend
                        ? unfollow.mutate({ userId: candidate.id })
                        : follow.mutate({ userId: candidate.id })
                    }
                  >
                    {isFriend ? 'Unfollow' : 'Follow'}
                  </button>
                </li>
              )
            })}
        </ul>
      </section>
    </div>
  )
}

export default FriendsPage
