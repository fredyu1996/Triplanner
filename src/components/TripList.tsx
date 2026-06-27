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
        <h1>🗺️ Triplanner</h1>
        <p>Plan routes on a map. Tick off checkpoints, note what to order, list things to do.</p>
      </header>

      <form className="trip-list__create" onSubmit={create}>
        <input
          type="text"
          placeholder="Name your next trip… e.g. Road trip down the coast"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New trip name"
        />
        <button type="submit">Create trip</button>
      </form>

      {trips.length === 0 ? (
        <p className="empty">No trips yet. Create one above to get started.</p>
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
                    {total} checkpoint{total === 1 ? '' : 's'}
                    {total > 0 && ` · ${visited}/${total} visited`}
                  </span>
                </button>
                <button
                  className="trip-card__delete"
                  aria-label={`Delete ${trip.name}`}
                  title="Delete trip"
                  onClick={() => {
                    if (confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
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
