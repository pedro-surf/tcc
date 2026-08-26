import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './SpotLocationPicker.css'

export type LatLng = {
  lat: number
  lng: number
}

type Props = {
  value?: LatLng | null
  onChange: (coords: LatLng) => void
  height?: number
  defaultCenter?: LatLng
}

const DEFAULT_CENTER: LatLng = { lat: -27.595, lng: -48.548 }

function isValidCoords(value: LatLng | null | undefined): value is LatLng {
  return (
    value != null &&
    !Number.isNaN(value.lat) &&
    !Number.isNaN(value.lng) &&
    (value.lat !== 0 || value.lng !== 0)
  )
}

export function SpotLocationPicker({
  value,
  onChange,
  height = 280,
  defaultCenter = DEFAULT_CENTER,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initial = isValidCoords(value)
      ? [value.lat, value.lng] as L.LatLngExpression
      : ([defaultCenter.lat, defaultCenter.lng] as L.LatLngExpression)

    const map = L.map(containerRef.current, {
      center: initial,
      zoom: isValidCoords(value) ? 12 : 6,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const markerIcon = L.divIcon({
      className: 'spot-map-marker',
      html: '<span aria-hidden="true"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const setMarker = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
          icon: markerIcon,
        }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng()
          onChangeRef.current({ lat: pos.lat, lng: pos.lng })
        })
      }
    }

    if (isValidCoords(value)) {
      setMarker(value.lat, value.lng)
    }

    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      setMarker(lat, lng)
      onChangeRef.current({ lat, lng })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [defaultCenter.lat, defaultCenter.lng])

  useEffect(() => {
    if (!mapRef.current || !isValidCoords(value)) return
    const next = L.latLng(value.lat, value.lng)
    if (markerRef.current) {
      markerRef.current.setLatLng(next)
    } else {
      const markerIcon = L.divIcon({
        className: 'spot-map-marker',
        html: '<span aria-hidden="true"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      markerRef.current = L.marker(next, {
        draggable: true,
        icon: markerIcon,
      }).addTo(mapRef.current)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng()
        onChangeRef.current({ lat: pos.lat, lng: pos.lng })
      })
    }
    mapRef.current.panTo(next)
  }, [value])

  const coordsLabel = isValidCoords(value)
    ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
    : 'Click the map to drop a pin'

  return (
    <div className="spot-location-picker">
      <div className="spot-location-picker__hint">
        Click the map or drag the pin to set the break location. Uses free
        OpenStreetMap tiles (no API key).
      </div>
      <div
        ref={containerRef}
        className="spot-location-picker__map"
        style={{ height }}
        role="application"
        aria-label="Spot location map"
      />
      <div className="spot-location-picker__coords">{coordsLabel}</div>
    </div>
  )
}

export default SpotLocationPicker
