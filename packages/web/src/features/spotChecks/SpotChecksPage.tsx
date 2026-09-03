import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PaginatedList,
  type ListColumn,
} from '../../components/list/PaginatedList'
import { mediaAbsoluteUrl } from '../../graphql/client'
import {
  useGetSpotChecksQuery,
  type GetSpotChecksQuery,
} from '../../generated/graphql'
import { CreateSpotCheck } from './CreateSpotCheck'
import './SpotChecksPage.css'

type SpotCheckRow = GetSpotChecksQuery['spotchecks'][number]

const PAGE_SIZE = 10

export function SpotChecksPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'list' | 'create'>('list')
  const [page, setPage] = useState(0)
  const [listKey, setListKey] = useState(0)

  const { data, isLoading, error, isFetching } = useGetSpotChecksQuery({
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  })

  const items = data?.spotchecks ?? []

  const columns: ListColumn<SpotCheckRow>[] = useMemo(
    () => [
      {
        key: 'timestamp',
        header: 'When',
        render: (row) => new Date(row.timestamp).toLocaleString(),
      },
      {
        key: 'score',
        header: 'Score',
        render: (row) => row.score.toFixed(1),
      },
      {
        key: 'description',
        header: 'Description',
        render: (row) => row.description,
      },
      {
        key: 'media',
        header: 'Media',
        render: (row) => {
          const first = row.media[0]
          if (!first) return '—'
          const url = mediaAbsoluteUrl(first.mediaUrl)
          if (first.mediaType === 'VIDEO') {
            return (
              <a href={url} target="_blank" rel="noreferrer">
                Video ({row.media.length})
              </a>
            )
          }
          return (
            <a href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt=""
                style={{
                  width: 64,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 6,
                  verticalAlign: 'middle',
                }}
              />{' '}
              ({row.media.length})
            </a>
          )
        },
      },
    ],
    [],
  )

  if (view === 'create') {
    return (
      <div className="spot-checks-page">
        <CreateSpotCheck
          onCancel={() => setView('list')}
          onRequireAuth={() => navigate('/account')}
          onCreated={() => {
            setListKey((key) => key + 1)
            setView('list')
          }}
        />
      </div>
    )
  }

  return (
    <div className="spot-checks-page">
      <PaginatedList
        key={listKey}
        title="Spot checks"
        items={items}
        columns={columns}
        getRowKey={(row) => row.id}
        isLoading={isLoading || isFetching}
        error={error as Error | null}
        page={page}
        pageSize={PAGE_SIZE}
        hasNextPage={items.length >= PAGE_SIZE}
        onPageChange={setPage}
        toolbar={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setView('create')}
          >
            New spot check
          </button>
        }
        emptyMessage="No spot checks yet."
      />
    </div>
  )
}

export default SpotChecksPage
