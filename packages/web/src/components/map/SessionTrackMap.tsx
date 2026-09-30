import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Sample } from '../../types'
import { splitGpsTrack } from '../../features/sessions/sessionTrack'
import './SessionTrackMap.css'

type Props = {
  samples: Sample[]
  cursor: number
  height?: number
}

const PIN_ICON = L.divIcon({
  className: 'session-map-pin',
  html: '<span aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function SessionTrackMap({ samples, cursor, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const traveledRef = useRef<L.Polyline | null>(null)
  const remainingRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [following, setFollowing] = useState(false)

  const split = useMemo(
    () => splitGpsTrack(samples, cursor),
    [samples, cursor],
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current || split.track.length === 0) return

    const map = L.map(containerRef.current, {
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
      traveledRef.current = null
      remainingRef.current = null
      markerRef.current = null
    }
  }, [split.track.length])

  useEffect(() => {
    const map = mapRef.current
    if (!map || split.track.length === 0) return

    const traveled = split.traveled.map(
      (point) => [point.lat, point.lon] as L.LatLngTuple,
    )
    const remaining = split.remaining.map(
      (point) => [point.lat, point.lon] as L.LatLngTuple,
    )

    const firstDraw = !remainingRef.current
    if (!remainingRef.current) {
      remainingRef.current = L.polyline(remaining, {
        color: '#94a3b8',
        weight: 3,
        opacity: 0.85,
      }).addTo(map)
      const bounds = L.latLngBounds(
        split.track.map((point) => [point.lat, point.lon] as L.LatLngTuple),
      )
      requestAnimationFrame(() => {
        if (!mapRef.current) return
        mapRef.current.invalidateSize()
        mapRef.current.fitBounds(bounds.pad(0.2), { animate: false })
      })
    } else {
      remainingRef.current.setLatLngs(remaining)
    }

    if (!traveledRef.current) {
      traveledRef.current = L.polyline(traveled, {
        color: '#0284c7',
        weight: 4,
      }).addTo(map)
    } else {
      traveledRef.current.setLatLngs(traveled)
    }

    if (!split.position) return
    const next = L.latLng(split.position.lat, split.position.lon)
    if (!markerRef.current) {
      markerRef.current = L.marker(next, {
        icon: PIN_ICON,
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map)
    } else {
      markerRef.current.setLatLng(next)
    }

    if (following && !firstDraw) {
      map.panTo(next, { animate: false })
    }
  }, [split, following])

  if (split.track.length === 0) {
    return (
      <div className="session-track-map session-track-map--empty" style={{ height }}>
        <p>No GPS fixes in this session.</p>
      </div>
    )
  }

  const coords = split.position
    ? `${split.position.lat.toFixed(5)}, ${split.position.lon.toFixed(5)}`
    : '—'

  return (
    <div className="session-track-map">
      <div
        ref={containerRef}
        className="session-track-map__canvas"
        style={{ height }}
        role="application"
        aria-label="Session GPS track"
      />
      <div className="session-track-map__footer">
        <span>{coords}</span>
        <button
          type="button"
          className={following ? 'is-active' : ''}
          onClick={() => setFollowing(true)}
        >
          {following ? 'Following' : 'Follow pin'}
        </button>
      </div>
    </div>
  )
}

export default SessionTrackMap
