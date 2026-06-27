import { useTripStore } from './lib/useTripStore'
import { TripList } from './components/TripList'
import { TripView } from './components/TripView'

export function App() {
  const [state, dispatch] = useTripStore()
  const activeTrip = state.trips.find((t) => t.id === state.activeTripId) ?? null

  return (
    <div className="app">
      {activeTrip ? (
        <TripView trip={activeTrip} dispatch={dispatch} />
      ) : (
        <TripList trips={state.trips} dispatch={dispatch} />
      )}
    </div>
  )
}
