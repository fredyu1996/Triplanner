import { useState } from 'react'
import type { Trip } from '../types'
import type { Action } from '../lib/store'

interface Props {
  trips: Trip[]
  dispatch: React.Dispatch<Action>
}

export function TripList({ trips, dispatch }: Props) {
  const [name, setName] = useState('')

  function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({ type: 'createTrip', name })
    setName('')
  }

  return (
    <div className="trip-list">
      <header className="trip-list__header">
        <h1>🗺️ Triplanner 行程規劃</h1>
        <p>在地圖上規劃路線，逐一剔走檢查點、記下想點的菜、列出想做的活動。</p>
      </header>

      <form className="trip-list__create" onSubmit={create}>
        <input
          type="text"
          placeholder="為你下一個行程改名⋯⋯例如:沿海公路之旅"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="新行程名稱"
        />
        <button type="submit">新增行程</button>
      </form>

      {trips.length === 0 ? (
        <p className="empty">還沒有行程,在上方新增一個開始吧。</p>
      ) : (
        <ul className="trip-cards">
          {trips.map((trip) => {
            const total = trip.checkpoints.length
            const visited = trip.checkpoints.filter((c) => c.visited).length
            return (
              <li key={trip.id} className="trip-card">
                <button className="trip-card__open" onClick={() => dispatch({ type: 'openTrip', tripId: trip.id })}>
                  <span className="trip-card__name">{trip.name}</span>
                  <span className="trip-card__meta">
                    {total} 個檢查點
                    {total > 0 && ` · 已到 ${visited}/${total}`}
                  </span>
                </button>
                <button
                  className="trip-card__delete"
                  aria-label={`刪除 ${trip.name}`}
                  title="刪除行程"
                  onClick={() => {
                    if (confirm(`刪除「${trip.name}」?此操作無法復原。`)) {
                      dispatch({ type: 'deleteTrip', tripId: trip.id })
                    }
                  }}
                >
                  🗑
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
