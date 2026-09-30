import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Sample } from '../../types'
import { gpsTrack } from '../sessions/sessionTrack'
import './LiveMiniMap.css'

type Props = {
  samples: Sample[]
}

type Offset = {
  x: number
  y: number
}

const PIN_ICON = L.divIcon({
  className: 'live-mini-map__pin',
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const DEFAULT_CENTER: L.LatLngExpression = [-27.6, -48.45]

export function LiveMiniMap({ samples }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const trailRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const dragRef = useRef<{ pointerId: number; dx: number; dy: number } | null>(null)
  const [offset, setOffset] = useState<Offset | null>(null)
  const [following, setFollowing] = useState(true)

  const track = useMemo(() => gpsTrack(samples), [samples])
  const latest = track.at(-1) ?? null

  useEffect(() => {
    const container = mapElRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: DEFAULT_CENTER,
      zoom: 11,
      scrollWheelZoom: true,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    map.on('dragstart', () => setFollowing(false))
    mapRef.current = map
    const frame = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
      trailRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const latLngs = track.map((point) => [point.lat, point.lon] as L.LatLngTuple)
    if (!trailRef.current) {
      trailRef.current = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 3,
      }).addTo(map)
    } else {
      trailRef.current.setLatLngs(latLngs)
    }

    if (!latest) return
    const next = L.latLng(latest.lat, latest.lon)
    if (!markerRef.current) {
      markerRef.current = L.marker(next, {
        icon: PIN_ICON,
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map)
      map.setView(next, 17, { animate: false })
    } else {
      markerRef.current.setLatLng(next)
      if (following) map.panTo(next, { animate: false })
    }
  }, [track, latest, following])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    const panel = panelRef.current
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setOffset({ x: rect.left, y: rect.top })
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const panel = panelRef.current
    if (!drag || drag.pointerId !== event.pointerId || !panel) return
    const width = panel.offsetWidth
    const height = panel.offsetHeight
    const maxX = Math.max(8, window.innerWidth - width - 8)
    const maxY = Math.max(8, window.innerHeight - height - 8)
    setOffset({
      x: Math.min(maxX, Math.max(8, event.clientX - drag.dx)),
      y: Math.min(maxY, Math.max(8, event.clientY - drag.dy)),
    })
  }

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const coords = latest
    ? `${latest.lat.toFixed(5)}, ${latest.lon.toFixed(5)}`
    : 'Waiting for GPS fix'

  return (
    <aside
      ref={panelRef}
      className="live-mini-map"
      style={offset ? { left: offset.x, top: offset.y, bottom: 'auto' } : undefined}
    >
      <header
        className="live-mini-map__handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span>Live GPS</span>
        <button
          type="button"
          className={following ? 'is-active' : ''}
          onClick={() => setFollowing(true)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      </header>
      <div
        ref={mapElRef}
        className="live-mini-map__canvas"
        role="application"
        aria-label="Live buoy GPS map"
      />
      <footer className="live-mini-map__coords">{coords}</footer>
    </aside>
  )
}
