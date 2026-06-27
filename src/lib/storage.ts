import type { AppState } from '../types'

const STORAGE_KEY = 'triplanner.state.v1'

const EMPTY_STATE: AppState = { trips: [], activeTripId: null }

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.trips)) return EMPTY_STATE
    return parsed
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — fail silently, app still works in-memory.
  }
}

/** A friendly sample trip so the app isn't empty on first run. */
function seedState(): AppState {
  const tripId = 'sample-trip'
  const state: AppState = {
    activeTripId: null,
    trips: [
      {
        id: tripId,
        name: 'Weekend in Kyoto (sample)',
        createdAt: Date.now(),
        checkpoints: [
          {
            id: 'cp-1',
            name: 'Fushimi Inari Shrine',
            kind: 'place',
            lat: 34.9671,
            lng: 135.7727,
            notes: 'Famous thousand torii gates. Go early to beat the crowds.',
            visited: false,
            order: 0,
            food: [],
            activities: [
              { id: 'a-1', name: 'Hike the full torii loop', note: '~2 hours', done: false },
            ],
          },
          {
            id: 'cp-2',
            name: 'Nishiki Market',
            kind: 'restaurant',
            lat: 35.005,
            lng: 135.7649,
            notes: "Kyoto's kitchen — a covered street of food stalls.",
            visited: false,
            order: 1,
            food: [
              { id: 'f-1', name: 'Tako tamago (candied octopus)', note: 'Street snack', ordered: false },
              { id: 'f-2', name: 'Soy milk donut', ordered: false },
              { id: 'f-3', name: 'Fresh yuba (tofu skin)', note: 'Local specialty', ordered: false },
            ],
            activities: [],
          },
          {
            id: 'cp-3',
            name: 'Arashiyama Bamboo Grove',
            kind: 'activity',
            lat: 35.0094,
            lng: 135.6717,
            notes: 'Towering bamboo paths in the west of the city.',
            visited: false,
            order: 2,
            food: [],
            activities: [
              { id: 'a-2', name: 'Walk the bamboo path', done: false },
              { id: 'a-3', name: 'Rent a rowboat on the river', note: 'Seasonal', done: false },
            ],
          },
        ],
      },
    ],
  }
  saveState(state)
  return state
}
