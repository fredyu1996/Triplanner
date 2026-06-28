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
          ← 行程
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
          <h1 className="trip-view__title" onClick={() => setEditingName(true)} title="點按重新命名">
            {trip.name}
          </h1>
        )}
        <span className="trip-view__progress">
          已到 {visitedCount}/{ordered.length}
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
          <p className="map-hint">💡 點按地圖任何位置加入檢查點;拖動圖釘可移動位置。</p>
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
              <h2>行程</h2>
              {ordered.length === 0 ? (
                <p className="empty">點按地圖加入第一個地點。</p>
              ) : (
                <ol className="itinerary__list">
                  {ordered.map((cp, i) => (
                    <li key={cp.id} className={`itinerary__item ${cp.visited ? 'is-visited' : ''}`}>
                      <input
                        type="checkbox"
                        checked={cp.visited}
                        onChange={() => dispatch({ type: 'toggleVisited', tripId: trip.id, checkpointId: cp.id })}
                        aria-label={`標記 ${cp.name} 為已到`}
                      />
                      <button className="itinerary__open" onClick={() => setSelectedId(cp.id)}>
                        <span className="itinerary__num">{i + 1}</span>
                        <span className="itinerary__name">
                          {kindEmoji(cp.kind)} {cp.name}
                        </span>
                        <span className="itinerary__sub">
                          {cp.kind === 'restaurant' && cp.food.length > 0 && `${cp.food.length} 樣想點`}
                          {cp.kind === 'activity' && cp.activities.length > 0 && `${cp.activities.length} 個活動`}
                        </span>
                      </button>
                      <span className="itinerary__reorder">
                        <button
                          disabled={i === 0}
                          onClick={() => dispatch({ type: 'reorderCheckpoint', tripId: trip.id, checkpointId: cp.id, direction: 'up' })}
                          aria-label="上移"
                        >
                          ↑
                        </button>
                        <button
                          disabled={i === ordered.length - 1}
                          onClick={() => dispatch({ type: 'reorderCheckpoint', tripId: trip.id, checkpointId: cp.id, direction: 'down' })}
                          aria-label="下移"
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
