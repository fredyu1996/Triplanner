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
  | { type: 'addCheckpoint'; tripId: string; lat: number; lng: number; name?: string }
  | { type: 'updateCheckpoint'; tripId: string; checkpointId: string; patch: Partial<Checkpoint> }
  | { type: 'moveCheckpoint'; tripId: string; checkpointId: string; lat: number; lng: number }
  | { type: 'deleteCheckpoint'; tripId: string; checkpointId: string }
  | { type: 'reorderCheckpoint'; tripId: string; checkpointId: string; direction: 'up' | 'down' }
  | { type: 'toggleVisited'; tripId: string; checkpointId: string }
  | { type: 'addFood'; tripId: string; checkpointId: string; name: string; note?: string }
  | { type: 'updateFood'; tripId: string; checkpointId: string; foodId: string; patch: Partial<FoodItem> }
  | { type: 'deleteFood'; tripId: string; checkpointId: string; foodId: string }
  | { type: 'addActivity'; tripId: string; checkpointId: string; name: string; note?: string }
  | { type: 'updateActivity'; tripId: string; checkpointId: string; activityId: string; patch: Partial<Activity> }
  | { type: 'deleteActivity'; tripId: string; checkpointId: string; activityId: string }

function nextOrder(checkpoints: Checkpoint[]): number {
  return checkpoints.reduce((max, c) => Math.max(max, c.order), -1) + 1
}

function defaultName(kind: CheckpointKind, index: number): string {
  const label = kind === 'restaurant' ? 'Restaurant' : kind === 'activity' ? 'Activity' : 'Stop'
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
        name: action.name.trim() || 'Untitled trip',
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

    case 'addCheckpoint':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (t) => {
          const order = nextOrder(t.checkpoints)
          const checkpoint: Checkpoint = {
            id: uid(),
            name: action.name?.trim() || defaultName('place', order + 1),
            kind: 'place',
            lat: action.lat,
            lng: action.lng,
            notes: '',
            visited: false,
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

/** Re-number checkpoints to 0..n-1 in their current sorted order. */
function normalizeOrder(checkpoints: Checkpoint[]): Checkpoint[] {
  return [...checkpoints]
    .sort((a, b) => a.order - b.order)
    .map((c, i) => ({ ...c, order: i }))
}

/** Swap a checkpoint with its neighbour in the ordered list. */
function reorder(checkpoints: Checkpoint[], checkpointId: string, direction: 'up' | 'down'): Checkpoint[] {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order)
  const index = sorted.findIndex((c) => c.id === checkpointId)
  if (index === -1) return checkpoints
  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= sorted.length) return checkpoints
  ;[sorted[index], sorted[swapWith]] = [sorted[swapWith], sorted[index]]
  return sorted.map((c, i) => ({ ...c, order: i }))
}
