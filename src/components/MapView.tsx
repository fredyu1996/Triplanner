import { useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Checkpoint } from '../types'
import { kindEmoji, kindLabel } from '../lib/labels'

interface Props {
  checkpoints: Checkpoint[]
  activeDay: number
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

/** Distinct colours per day for route lines (cycles for long trips). */
const DAY_COLORS = ['#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1', '#15803d', '#c2410c']
const dayColor = (day: number) => DAY_COLORS[(day - 1) % DAY_COLORS.length]

/** Numbered pin built from inline HTML so we don't depend on Leaflet's image assets. */
function pinIcon(cp: Checkpoint, index: number, selected: boolean, dim: boolean): L.DivIcon {
  const color = cp.visited ? '#16a34a' : KIND_COLOR[cp.kind]
  const ring = selected ? 'box-shadow:0 0 0 4px rgba(15,118,110,.35);' : ''
  const check = cp.visited ? '<span class="pin__check">✓</span>' : ''
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin ${dim ? 'pin--dim' : ''}" style="background:${color};${ring}" title="${cp.name}">
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

/** Pan/zoom to fit the given checkpoints whenever their coordinates change. */
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

export function MapView({ checkpoints, activeDay, selectedId, onAdd, onSelect, onMove }: Props) {
  // Group checkpoints by day, each ordered within the day.
  const byDay = useMemo(() => {
    const map = new Map<number, Checkpoint[]>()
    for (const c of checkpoints) {
      const list = map.get(c.day) ?? []
      list.push(c)
      map.set(c.day, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order)
    return map
  }, [checkpoints])

  const activeStops = byDay.get(activeDay) ?? []
  const fitStops = activeStops.length > 0 ? activeStops : checkpoints
  const center: [number, number] =
    checkpoints.length > 0 ? [checkpoints[0].lat, checkpoints[0].lng] : [35.0116, 135.7681]

  return (
    <MapContainer center={center} zoom={checkpoints.length > 0 ? 12 : 5} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ClickToAdd onAdd={onAdd} />
      <FitBounds checkpoints={fitStops} />

      {/* One route line per day, the active day emphasised. */}
      {[...byDay.entries()].map(([day, stops]) => {
        if (stops.length < 2) return null
        const isActive = day === activeDay
        return (
          <Polyline
            key={`route-${day}`}
            positions={stops.map((c) => [c.lat, c.lng] as [number, number])}
            pathOptions={{
              color: dayColor(day),
              weight: isActive ? 4 : 3,
              opacity: isActive ? 0.8 : 0.3,
              dashArray: '1 8',
            }}
          />
        )
      })}

      {[...byDay.entries()].map(([day, stops]) =>
        stops.map((cp, i) => (
          <Marker
            key={cp.id}
            position={[cp.lat, cp.lng]}
            icon={pinIcon(cp, i, cp.id === selectedId, day !== activeDay)}
            zIndexOffset={day === activeDay ? 1000 : 0}
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
                第 {cp.day} 日 · {i + 1}. {cp.name}
              </strong>
              <br />
              {kindEmoji(cp.kind)} {kindLabel(cp.kind)}
              {cp.visited && ' · ✓ 已到'}
            </Popup>
          </Marker>
        )),
      )}
    </MapContainer>
  )
}
