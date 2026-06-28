import { useEffect, useState } from 'react'
import type { Trip } from '../types'
import type { Action } from '../lib/store'
import { MapView } from './MapView'
import { CheckpointDetail } from './CheckpointDetail'
import { SearchBox } from './SearchBox'
import { kindEmoji } from '../lib/labels'

interface Props {
  trip: Trip
  dispatch: React.Dispatch<Action>
}

export function TripView({ trip, dispatch }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [activeDay, setActiveDay] = useState(1)

  // Keep the active day within range as days are added/removed.
  useEffect(() => {
    if (activeDay > trip.days) setActiveDay(trip.days)
  }, [trip.days, activeDay])

  const selected = trip.checkpoints.find((c) => c.id === selectedId) ?? null
  const dayStops = trip.checkpoints.filter((c) => c.day === activeDay).sort((a, b) => a.order - b.order)
  const visitedCount = trip.checkpoints.filter((c) => c.visited).length

  function addAt(lat: number, lng: number, name?: string) {
    dispatch({ type: 'addCheckpoint', tripId: trip.id, lat, lng, day: activeDay, name })
  }

  function addDay() {
    dispatch({ type: 'addDay', tripId: trip.id })
    setActiveDay(trip.days + 1)
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
          已到 {visitedCount}/{trip.checkpoints.length}
        </span>
      </header>

      {/* Day tabs: pick the day you're planning; new stops go to this day. */}
      <nav className="day-tabs">
        {Array.from({ length: trip.days }, (_, i) => i + 1).map((d) => {
          const count = trip.checkpoints.filter((c) => c.day === d).length
          return (
            <button
              key={d}
              className={`day-tab ${d === activeDay ? 'day-tab--active' : ''}`}
              onClick={() => setActiveDay(d)}
            >
              第 {d} 日{count > 0 && <span className="day-tab__count">{count}</span>}
            </button>
          )
        })}
        <button className="day-tab day-tab--add" onClick={addDay} title="新增一日">
          ＋ 加一日
        </button>
        {trip.days > 1 && dayStops.length === 0 && (
          <button
            className="day-tab day-tab--del"
            title="刪除此空白日"
            onClick={() => {
              dispatch({ type: 'removeDay', tripId: trip.id, day: activeDay })
              setActiveDay((d) => Math.max(1, d - 1))
            }}
          >
            🗑 刪除此日
          </button>
        )}
      </nav>

      <div className="trip-view__body">
        <section className="trip-view__map">
          <div className="trip-view__search">
            <SearchBox onPick={(r) => addAt(r.lat, r.lng, r.name)} />
          </div>
          <MapView
            checkpoints={trip.checkpoints}
            activeDay={activeDay}
            selectedId={selectedId}
            onAdd={addAt}
            onSelect={setSelectedId}
            onMove={(id, lat, lng) => dispatch({ type: 'moveCheckpoint', tripId: trip.id, checkpointId: id, lat, lng })}
          />
          <p className="map-hint">💡 搜尋地點,或點按地圖加入「第 {activeDay} 日」的檢查點。拖動圖釘可移動。</p>
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
              <h2>第 {activeDay} 日行程</h2>
              {dayStops.length === 0 ? (
                <p className="empty">搜尋地點,或點按地圖加入這一日的第一個地點。</p>
              ) : (
                <ol className="itinerary__list">
                  {dayStops.map((cp, i) => (
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
                          disabled={i === dayStops.length - 1}
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
