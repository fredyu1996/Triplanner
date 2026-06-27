import { useState } from 'react'
import type { Trip } from '../types'
import type { Action } from '../lib/store'
import { MapView } from './MapView'
import { CheckpointDetail } from './CheckpointDetail'
import { kindEmoji } from '../lib/labels'

interface Props {
  trip: Trip
  dispatch: React.Dispatch<Action>
}

export function TripView({ trip, dispatch }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)

  const ordered = [...trip.checkpoints].sort((a, b) => a.order - b.order)
  const selected = ordered.find((c) => c.id === selectedId) ?? null
  const visitedCount = ordered.filter((c) => c.visited).length

  function addCheckpoint(lat: number, lng: number) {
    dispatch({ type: 'addCheckpoint', tripId: trip.id, lat, lng })
  }

  return (
    <div className="trip-view">
      <header className="trip-view__bar">
        <button className="back" onClick={() => dispatch({ type: 'openTrip', tripId: null })}>
          ← Trips
        </button>
        {editingName ? (
          <input
            className="trip-view__title-input"
            autoFocus
            defaultValue={trip.name}
            onBlur={(e) => {
              dispatch({ type: 'renameTrip', tripId: trip.id, name: e.target.value })
              setEditingName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        ) : (
          <h1 className="trip-view__title" onClick={() => setEditingName(true)} title="Click to rename">
            {trip.name}
          </h1>
        )}
        <span className="trip-view__progress">
          {visitedCount}/{ordered.length} visited
        </span>
      </header>

      <div className="trip-view__body">
        <section className="trip-view__map">
          <MapView
            checkpoints={ordered}
            selectedId={selectedId}
            onAdd={addCheckpoint}
            onSelect={setSelectedId}
            onMove={(id, lat, lng) => dispatch({ type: 'moveCheckpoint', tripId: trip.id, checkpointId: id, lat, lng })}
          />
          <p className="map-hint">💡 Click anywhere on the map to drop a checkpoint. Drag a pin to move it.</p>
        </section>

        <aside className="trip-view__side">
          {selected ? (
            <CheckpointDetail
              trip={trip}
              checkpoint={selected}
              dispatch={dispatch}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="itinerary">
              <h2>Itinerary</h2>
              {ordered.length === 0 ? (
                <p className="empty">Click the map to add your first stop.</p>
              ) : (
                <ol className="itinerary__list">
                  {ordered.map((cp, i) => (
                    <li key={cp.id} className={`itinerary__item ${cp.visited ? 'is-visited' : ''}`}>
                      <input
                        type="checkbox"
                        checked={cp.visited}
                        onChange={() => dispatch({ type: 'toggleVisited', tripId: trip.id, checkpointId: cp.id })}
                        aria-label={`Mark ${cp.name} visited`}
                      />
                      <button className="itinerary__open" onClick={() => setSelectedId(cp.id)}>
                        <span className="itinerary__num">{i + 1}</span>
                        <span className="itinerary__name">
                          {kindEmoji(cp.kind)} {cp.name}
                        </span>
                        <span className="itinerary__sub">
                          {cp.kind === 'restaurant' && cp.food.length > 0 && `${cp.food.length} to order`}
                          {cp.kind === 'activity' && cp.activities.length > 0 && `${cp.activities.length} to do`}
                        </span>
                      </button>
                      <span className="itinerary__reorder">
                        <button
                          disabled={i === 0}
                          onClick={() => dispatch({ type: 'reorderCheckpoint', tripId: trip.id, checkpointId: cp.id, direction: 'up' })}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          disabled={i === ordered.length - 1}
                          onClick={() => dispatch({ type: 'reorderCheckpoint', tripId: trip.id, checkpointId: cp.id, direction: 'down' })}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
