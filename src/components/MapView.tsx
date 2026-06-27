import { useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Checkpoint } from '../types'
import { kindEmoji } from '../lib/labels'

interface Props {
  checkpoints: Checkpoint[]
  selectedId: string | null
  onAdd: (lat: number, lng: number) => void
  onSelect: (id: string) => void
  onMove: (id: string, lat: number, lng: number) => void
}

const KIND_COLOR: Record<Checkpoint['kind'], string> = {
  place: '#0ea5e9',
  restaurant: '#f97316',
  activity: '#a855f7',
}

/** Numbered pin built from inline HTML so we don't depend on Leaflet's image assets. */
function pinIcon(cp: Checkpoint, index: number, selected: boolean): L.DivIcon {
  const color = cp.visited ? '#16a34a' : KIND_COLOR[cp.kind]
  const ring = selected ? 'box-shadow:0 0 0 4px rgba(15,118,110,.35);' : ''
  const check = cp.visited ? '<span class="pin__check">✓</span>' : ''
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin" style="background:${color};${ring}" title="${cp.name}">
        <span class="pin__emoji">${kindEmoji(cp.kind)}</span>
        <span class="pin__num">${index + 1}</span>${check}
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function ClickToAdd({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Pan/zoom to fit all checkpoints whenever the set of coordinates changes. */
function FitBounds({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const map = useMap()
  const key = checkpoints.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`).join('|')
  useMemo(() => {
    if (checkpoints.length === 0) return
    if (checkpoints.length === 1) {
      map.setView([checkpoints[0].lat, checkpoints[0].lng], 13)
      return
    }
    const bounds = L.latLngBounds(checkpoints.map((c) => [c.lat, c.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

export function MapView({ checkpoints, selectedId, onAdd, onSelect, onMove }: Props) {
  const ordered = useMemo(() => [...checkpoints].sort((a, b) => a.order - b.order), [checkpoints])
  const line = ordered.map((c) => [c.lat, c.lng] as [number, number])

  const center: [number, number] = ordered.length > 0 ? [ordered[0].lat, ordered[0].lng] : [35.0116, 135.7681]

  return (
    <MapContainer center={center} zoom={ordered.length > 0 ? 12 : 5} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ClickToAdd onAdd={onAdd} />
      <FitBounds checkpoints={ordered} />

      {line.length >= 2 && (
        <Polyline positions={line} pathOptions={{ color: '#0f766e', weight: 4, opacity: 0.7, dashArray: '1 8' }} />
      )}

      {ordered.map((cp, i) => (
        <Marker
          key={cp.id}
          position={[cp.lat, cp.lng]}
          icon={pinIcon(cp, i, cp.id === selectedId)}
          draggable
          eventHandlers={{
            click: () => onSelect(cp.id),
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng()
              onMove(cp.id, lat, lng)
            },
          }}
        >
          <Popup>
            <strong>
              {i + 1}. {cp.name}
            </strong>
            <br />
            {kindEmoji(cp.kind)} {cp.kind}
            {cp.visited && ' · ✓ visited'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
