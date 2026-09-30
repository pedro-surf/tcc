import { useEffect, useMemo, useRef, useState } from 'react'
import './MqttLogModal.css'

export type MqttLogLine = {
  t: number
  level: 'log' | 'warn' | 'error'
  message: string
}

type Props = {
  open: boolean
  lines: MqttLogLine[]
  onClose: () => void
}

const LEVEL_LABEL = {
  log: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
} as const

function formatTime(t: number) {
  const date = new Date(t)
  const pad = (n: number, width = 2) => String(n).padStart(width, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}`
  )
}

export function MqttLogModal({ open, lines, onClose }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const filterRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return lines
    return lines.filter((line) => line.message.toLowerCase().includes(needle))
  }, [lines, query])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    filterRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || !stickRef.current) return
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, visible])

  if (!open) return null

  return (
    <div className="mqtt-log" role="presentation" onClick={onClose}>
      <section
        className="mqtt-log__panel"
        role="dialog"
        aria-modal="true"
        aria-label="MQTT log"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mqtt-log__bar">
          <div>
            <p className="mqtt-log__group">buoy-mqtt</p>
            <h2>Live log</h2>
          </div>
          <label className="mqtt-log__filter">
            <span>Filter</span>
            <input
              ref={filterRef}
              value={query}
              placeholder="device, fix, error…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="button" className="mqtt-log__close" onClick={onClose}>
            Close
          </button>
        </header>
        <div
          ref={scrollerRef}
          className="mqtt-log__stream"
          onScroll={(event) => {
            const el = event.currentTarget
            stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28
          }}
        >
          {visible.length === 0 ? (
            <p className="mqtt-log__empty">
              {lines.length === 0
                ? 'No MQTT messages yet.'
                : 'No lines match the filter.'}
            </p>
          ) : (
            visible.map((line, index) => (
              <div
                key={`${line.t}-${index}`}
                className={`mqtt-log__row mqtt-log__row--${line.level}`}
              >
                <time dateTime={new Date(line.t).toISOString()}>{formatTime(line.t)}</time>
                <span className="mqtt-log__level">{LEVEL_LABEL[line.level]}</span>
                <span className="mqtt-log__msg">{line.message}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
