// Domain model for Triplanner.

export type CheckpointKind = 'place' | 'restaurant' | 'activity'

/** A single thing to order at a restaurant checkpoint. */
export interface FoodItem {
  id: string
  name: string
  /** Optional note: price, "must try", dietary info, etc. */
  note?: string
  ordered: boolean
}

/** Something to do around the area of a checkpoint. */
export interface Activity {
  id: string
  name: string
  note?: string
  done: boolean
}

/** A stop on the route. Ordered by `order`. */
export interface Checkpoint {
  id: string
  name: string
  kind: CheckpointKind
  lat: number
  lng: number
  /** Free-form notes (address, opening hours, reservation, ...). */
  notes: string
  /** Ticked off when you have reached / completed this stop. */
  visited: boolean
  /** Position in the itinerary; lower comes first. */
  order: number
  /** Only meaningful for restaurant checkpoints. */
  food: FoodItem[]
  /** Things to do around this checkpoint. */
  activities: Activity[]
}

export interface Trip {
  id: string
  name: string
  /** ISO date strings, optional. */
  startDate?: string
  endDate?: string
  checkpoints: Checkpoint[]
  createdAt: number
}

export interface AppState {
  trips: Trip[]
  /** id of the currently open trip, or null on the trips list screen. */
  activeTripId: string | null
}
