import { useMemo, useState, type ReactNode } from 'react'
import './PaginatedList.css'

export type ListColumn<T> = {
  key: string
  header: string
  render?: (item: T) => ReactNode
  accessor?: (item: T) => ReactNode
  filterable?: boolean
}

export type ListFilter = {
  key: string
  label: string
  type?: 'text' | 'select'
  placeholder?: string
  options?: Array<{ label: string; value: string }>
}

type PaginatedListProps<T> = {
  title?: string
  items: T[]
  columns: ListColumn<T>[]
  getRowKey: (item: T) => string
  isLoading?: boolean
  error?: Error | null
  page: number
  pageSize: number
  hasNextPage?: boolean
  onPageChange: (page: number) => void
  filters?: ListFilter[]
  filterValues?: Record<string, string>
  onFilterChange?: (filters: Record<string, string>) => void
  /** When true, text filters are applied to the current page client-side */
  clientFilter?: boolean
  toolbar?: ReactNode
  emptyMessage?: string
}

function getCellValue<T>(item: T, column: ListColumn<T>): ReactNode {
  if (column.render) return column.render(item)
  if (column.accessor) return column.accessor(item)
  return (item as Record<string, unknown>)[column.key] as ReactNode
}

function matchesClientFilters<T>(
  item: T,
  columns: ListColumn<T>[],
  filters: Record<string, string>,
): boolean {
  return Object.entries(filters).every(([key, rawValue]) => {
    const value = rawValue.trim().toLowerCase()
    if (!value) return true

    const column = columns.find((col) => col.key === key)
    const cell = column ? getCellValue(item, column) : (item as any)[key]
    return String(cell ?? '')
      .toLowerCase()
      .includes(value)
  })
}

export function PaginatedList<T>({
  title,
  items,
  columns,
  getRowKey,
  isLoading,
  error,
  page,
  pageSize,
  hasNextPage,
  onPageChange,
  filters = [],
  filterValues,
  onFilterChange,
  clientFilter = false,
  toolbar,
  emptyMessage = 'No results found.',
}: PaginatedListProps<T>) {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({})
  const activeFilters = filterValues ?? localFilters

  const setFilter = (key: string, value: string) => {
    const next = { ...activeFilters, [key]: value }
    if (filterValues === undefined) setLocalFilters(next)
    onFilterChange?.(next)
  }

  const visibleItems = useMemo(() => {
    if (!clientFilter) return items
    return items.filter((item) =>
      matchesClientFilters(item, columns, activeFilters),
    )
  }, [activeFilters, clientFilter, columns, items])

  const canGoPrev = page > 0
  const canGoNext =
    hasNextPage ?? (!isLoading && items.length >= pageSize && !clientFilter)

  return (
    <section className="paginated-list">
      {(title || toolbar || filters.length > 0) && (
        <header className="paginated-list__header">
          <div className="paginated-list__heading">
            {title ? <h2 className="paginated-list__title">{title}</h2> : null}
            {toolbar}
          </div>

          {filters.length > 0 ? (
            <div className="paginated-list__filters">
              {filters.map((filter) => (
                <label key={filter.key} className="paginated-list__filter">
                  <span>{filter.label}</span>
                  {filter.type === 'select' ? (
                    <select
                      value={activeFilters[filter.key] ?? ''}
                      onChange={(e) => setFilter(filter.key, e.target.value)}
                    >
                      <option value="">
                        {filter.placeholder ?? 'All'}
                      </option>
                      {(filter.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="search"
                      value={activeFilters[filter.key] ?? ''}
                      placeholder={filter.placeholder ?? `Filter ${filter.label.toLowerCase()}…`}
                      onChange={(e) => setFilter(filter.key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : null}
        </header>
      )}

      {error ? (
        <div className="paginated-list__state paginated-list__state--error">
          {error.message}
        </div>
      ) : null}

      <div className="paginated-list__table-wrap">
        <table className="paginated-list__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="paginated-list__state">
                  Loading…
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="paginated-list__state">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={getRowKey(item)}>
                  {columns.map((column) => (
                    <td key={column.key}>{getCellValue(item, column)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="paginated-list__footer">
        <span className="paginated-list__meta">
          Page {page + 1}
          {pageSize ? ` · ${pageSize} per page` : null}
          {visibleItems.length ? ` · ${visibleItems.length} shown` : null}
        </span>
        <div className="paginated-list__pager">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canGoPrev || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canGoNext || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}
