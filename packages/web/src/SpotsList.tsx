import { useGetSpotsQuery } from './generated/graphql'

export function SpotsList() {
  const { data, isLoading } = useGetSpotsQuery({
      endpoint: 'http://localhost:3000/graphql',
  }, { take: 10, skip: 1 })

  if (isLoading) return <div>Loading...</div>
  return (
    <ul>
      {data?.spots.map((spot) => (
        <li key={spot.id}>{spot.name}</li>
      ))}
    </ul>
  )
}