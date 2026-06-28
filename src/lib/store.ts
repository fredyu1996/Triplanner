import type {
  Activity,
  AppState,
  Checkpoint,
  CheckpointKind,
  FoodItem,
  Trip,
} from '../types'
import { uid } from './id'

export type Action =
  | { type: 'createTrip'; name: string }
  | { type: 'renameTrip'; tripId: string; name: string }
  | { type: 'setTripDates'; tripId: string; startDate?: string; endDate?: string }
  | { type: 'deleteTrip'; tripId: string }
  | { type: 'openTrip'; tripId: string | null }
  | { type: 'addDay'; tripId: string }
  | { type: 'removeDay'; tripId: string; day: number }
  | { type: 'addCheckpoint'; tripId: string; lat: number; lng: number; day: number; name?: string; kind?: CheckpointKind }
  | { type: 'updateCheckpoint'; tripId: string; checkpointId: string; patch: Partial<Checkpoint> }
  | { type: 'moveCheckpoint'; tripId: string; checkpointId: string; lat: number; lng: number }
  | { type: 'setCheckpointDay'; tripId: string; checkpointId: string; day: number }
  | { type: 'deleteCheckpoint'; tripId: string; checkpointId: string }
  | { type: 'reorderCheckpoint'; tripId: string; checkpointId: string; direction: 'up' | 'down' }
  | { type: 'toggleVisited'; tripId: string; checkpointId: string }
  | { type: 'addFood'; tripId: string; checkpointId: string; name: string; note?: string }
  | { type: 'updateFood'; tripId: string; checkpointId: string; foodId: string; patch: Partial<FoodItem> }
  | { type: 'deleteFood'; tripId: string; checkpointId: string; foodId: string }
  | { type: 'addActivity'; tripId: string; checkpointId: string; name: string; note?: string }
  | { type: 'updateActivity'; tripId: string; checkpointId: string; activityId: string; patch: Partial<Activity> }
  | { type: 'deleteActivity'; tripId: string; checkpointId: string; activityId: string }

/** Next order value for a checkpoint being appended to a given day. */
function nextOrderInDay(checkpoints: Checkpoint[], day: number): number {
  return checkpoints.filter((c) => c.day === day).reduce((max, c) => Math.max(max, c.order), -1) + 1
}

function defaultName(kind: CheckpointKind, index: number): string {
  const label = kind === 'restaurant' ? '餐廳' : kind === 'activity' ? '活動' : '地點'
  return `${label} ${index}`
}

/** Apply `fn` to the matching trip, returning a new trips array. */
function mapTrip(state: AppState, tripId: string, fn: (t: Trip) => Trip): Trip[] {
  return state.trips.map((t) => (t.id === tripId ? fn(t) : t))
}

/** Apply `fn` to the matching checkpoint inside a trip. */
function mapCheckpoint(trip: Trip, checkpointId: string, fn: (c: Checkpoint) => Checkpoint): Trip {
  return { ...trip, checkpoints: trip.checkpoints.map((c) => (c.id === checkpointId ? fn(c) : c)) }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'createTrip': {
      const trip: Trip = {
        id: uid(),
        name: action.name.trim() || '未命名行程',
        days: 1,
        checkpoints: [],
        createdAt: Date.now(),
      }
      return { ...state, trips: [trip, ...state.trips], activeTripId: trip.id }
    }

    case 'renameTrip':
      return { ...state, trips: mapTrip(state, action.tripId, (t) => ({ ...t, name: action.name.trim() || t.name })) }

    case 'setTripDates':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => ({
          ...t,
          startDate: action.startDate,
          endDate: action.endDate,
        })),
      }

    case 'deleteTrip':
      return {
        ...state,
        trips: state.trips.filter((t) => t.id !== action.tripId),
        activeTripId: state.activeTripId === action.tripId ? null : state.activeTripId,
      }

    case 'openTrip':
      return { ...state, activeTripId: action.tripId }

    case 'addDay':
      return { ...state, trips: mapTrip(state, action.tripId, (t) => ({ ...t, days: t.days + 1 })) }

    case 'removeDay':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => {
          if (t.days <= 1) return t
          // Only remove an empty day; shift later days down to close the gap.
          const hasStops = t.checkpoints.some((c) => c.day === action.day)
          if (hasStops) return t
          return {
            ...t,
            days: t.days - 1,
            checkpoints: t.checkpoints.map((c) => (c.day > action.day ? { ...c, day: c.day - 1 } : c)),
          }
        }),
      }

    case 'addCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => {
          const day = Math.min(Math.max(1, action.day), t.days)
          const order = nextOrderInDay(t.checkpoints, day)
          const checkpoint: Checkpoint = {
            id: uid(),
            name: action.name?.trim() || defaultName(action.kind ?? 'place', order + 1),
            kind: action.kind ?? 'place',
            lat: action.lat,
            lng: action.lng,
            notes: '',
            visited: false,
            day,
            order,
            food: [],
            activities: [],
          }
          return { ...t, checkpoints: [...t.checkpoints, checkpoint] }
        }),
      }

    case 'updateCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({ ...c, ...action.patch })),
        ),
      }

    case 'moveCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({ ...c, lat: action.lat, lng: action.lng })),
        ),
      }

    case 'setCheckpointDay':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => {
          const target = t.checkpoints.find((c) => c.id === action.checkpointId)
          if (!target) return t
          const day = Math.min(Math.max(1, action.day), t.days)
          if (day === target.day) return t
          const order = nextOrderInDay(t.checkpoints, day)
          return mapCheckpoint(t, action.checkpointId, (c) => ({ ...c, day, order }))
        }),
      }

    case 'deleteCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => ({
          ...t,
          checkpoints: normalizeOrder(t.checkpoints.filter((c) => c.id !== action.checkpointId)),
        })),
      }

    case 'reorderCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => ({
          ...t,
          checkpoints: reorder(t.checkpoints, action.checkpointId, action.direction),
        })),
      }

    case 'toggleVisited':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({ ...c, visited: !c.visited })),
        ),
      }

    case 'addFood':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            food: [...c.food, { id: uid(), name: action.name.trim(), note: action.note?.trim() || undefined, ordered: false }],
          })),
        ),
      }

    case 'updateFood':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            food: c.food.map((f) => (f.id === action.foodId ? { ...f, ...action.patch } : f)),
          })),
        ),
      }

    case 'deleteFood':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            food: c.food.filter((f) => f.id !== action.foodId),
          })),
        ),
      }

    case 'addActivity':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            activities: [...c.activities, { id: uid(), name: action.name.trim(), note: action.note?.trim() || undefined, done: false }],
          })),
        ),
      }

    case 'updateActivity':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            activities: c.activities.map((a) => (a.id === action.activityId ? { ...a, ...action.patch } : a)),
          })),
        ),
      }

    case 'deleteActivity':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) =>
          mapCheckpoint(t, action.checkpointId, (c) => ({
            ...c,
            activities: c.activities.filter((a) => a.id !== action.activityId),
          })),
        ),
      }

    default:
      return state
  }
}

/** Re-number each day's checkpoints to 0..n-1 in their current sorted order. */
function normalizeOrder(checkpoints: Checkpoint[]): Checkpoint[] {
  const counters = new Map<number, number>()
  return [...checkpoints]
    .sort((a, b) => a.day - b.day || a.order - b.order)
    .map((c) => {
      const next = counters.get(c.day) ?? 0
      counters.set(c.day, next + 1)
      return { ...c, order: next }
    })
}

/** Swap a checkpoint with its neighbour within the same day. */
function reorder(checkpoints: Checkpoint[], checkpointId: string, direction: 'up' | 'down'): Checkpoint[] {
  const target = checkpoints.find((c) => c.id === checkpointId)
  if (!target) return checkpoints
  const sameDay = checkpoints.filter((c) => c.day === target.day).sort((a, b) => a.order - b.order)
  const index = sameDay.findIndex((c) => c.id === checkpointId)
  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= sameDay.length) return checkpoints
  ;[sameDay[index], sameDay[swapWith]] = [sameDay[swapWith], sameDay[index]]
  const orderById = new Map(sameDay.map((c, i) => [c.id, i]))
  return checkpoints.map((c) => (orderById.has(c.id) ? { ...c, order: orderById.get(c.id)! } : c))
}
