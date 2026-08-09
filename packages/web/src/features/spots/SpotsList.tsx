import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  PaginatedList,
  type ListColumn,
  type ListFilter,
} from '../../components/list/PaginatedList'
import {
  BottomTypeEnum,
  CountryEnum,
  WaveTypeEnum,
  useGetSpotsQuery,
  type GetSpotsQuery,
} from '../../generated/graphql'

type SpotRow = GetSpotsQuery['spots'][number]

const PAGE_SIZE = 10

const columns: ListColumn<SpotRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (spot) => (
      <Link to={`/spots/${spot.id}`}>
        {spot.name}
        {spot.secret ? ' · secret' : ''}
      </Link>
    ),
  },
  {
    key: 'country',
    header: 'Country',
    render: (spot) => spot.country.replaceAll('_', ' '),
  },
  {
    key: 'waveType',
    header: 'Wave',
    render: (spot) => spot.waveType.replaceAll('_', ' '),
  },
  {
    key: 'bottomType',
    header: 'Bottom',
    render: (spot) => spot.bottomType.replaceAll('_', ' '),
  },
  {
    key: 'coords',
    header: 'Coords',
    render: (spot) => `${spot.lat.toFixed(3)}, ${spot.lng.toFixed(3)}`,
  },
  {
    key: 'difficulty',
    header: 'Difficulty',
    render: (spot) => spot.difficulty || '—',
  },
  {
    key: 'mapsUrl',
    header: 'Map',
    render: (spot) =>
      spot.mapsUrl ? (
        <a href={spot.mapsUrl} target="_blank" rel="noreferrer">
          Open
        </a>
      ) : (
        '—'
      ),
  },
]

type Props = {
  toolbar?: ReactNode
}

export function SpotsList({ toolbar }: Props) {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    country: '',
    waveType: '',
  })

  const variables = {
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    name: filters.name?.trim() || undefined,
  }

  const { data, isLoading, error, isFetching } = useGetSpotsQuery(variables)

  const spots = data?.spots ?? []

  const visibleSpots = useMemo(() => {
    return spots.filter((spot) => {
      if (filters.country && spot.country !== filters.country) return false
      if (filters.waveType && spot.waveType !== filters.waveType) return false
      return true
    })
  }, [filters.country, filters.waveType, spots])

  const listFilters: ListFilter[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Search by name…',
    },
    {
      key: 'country',
      label: 'Country',
      type: 'select',
      options: Object.values(CountryEnum).map((value) => ({
        value,
        label: value.replaceAll('_', ' '),
      })),
    },
    {
      key: 'waveType',
      label: 'Wave type',
      type: 'select',
      options: Object.values(WaveTypeEnum).map((value) => ({
        value,
        label: value.replaceAll('_', ' '),
      })),
    },
    {
      key: 'bottomType',
      label: 'Bottom',
      type: 'select',
      options: Object.values(BottomTypeEnum).map((value) => ({
        value,
        label: value.replaceAll('_', ' '),
      })),
    },
  ]

  // bottomType filter is client-only on the current page
  const filteredSpots = useMemo(() => {
    if (!filters.bottomType) return visibleSpots
    return visibleSpots.filter(
      (spot) => spot.bottomType === filters.bottomType,
    )
  }, [filters.bottomType, visibleSpots])

  return (
    <PaginatedList
      title="Spots"
      items={filteredSpots}
      columns={columns}
      getRowKey={(spot) => spot.id}
      isLoading={isLoading || isFetching}
      error={error as Error | null}
      page={page}
      pageSize={PAGE_SIZE}
      hasNextPage={spots.length >= PAGE_SIZE}
      onPageChange={setPage}
      filters={listFilters}
      filterValues={filters}
      onFilterChange={(next) => {
        setFilters(next)
        // Reset pagination when server-side name filter changes
        if (next.name !== filters.name) setPage(0)
      }}
      toolbar={toolbar}
      emptyMessage="No spots match these filters."
    />
  )
}

export default SpotsList
