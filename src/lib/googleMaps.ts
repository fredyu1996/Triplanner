// Build Google Maps universal links. No API key or billing needed — these just
// open the Google Maps app (or website) on the user's device.
// Docs: https://developers.google.com/maps/documentation/urls/get-started

import type { Checkpoint } from '../types'

/** Open a single point on Google Maps, centred on its exact coordinates. */
export function placeUrl(cp: Pick<Checkpoint, 'lat' | 'lng' | 'name'>): string {
  const params = new URLSearchParams({
    api: '1',
    query: `${cp.lat},${cp.lng}`,
  })
  return `https://www.google.com/maps/search/?${params.toString()}`
}

/**
 * Directions through an ordered list of stops.
 * One stop  -> route from the user's current location to it.
 * Two+ stops -> first is origin, last is destination, the rest are waypoints.
 */
export function directionsUrl(
  stops: Array<Pick<Checkpoint, 'lat' | 'lng'>>,
  travelmode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving',
): string | null {
  if (stops.length === 0) return null
  const coord = (c: { lat: number; lng: number }) => `${c.lat},${c.lng}`

  const params = new URLSearchParams({ api: '1', travelmode })
  if (stops.length === 1) {
    params.set('destination', coord(stops[0]))
  } else {
    params.set('origin', coord(stops[0]))
    params.set('destination', coord(stops[stops.length - 1]))
    const waypoints = stops.slice(1, -1)
    // Google caps waypoints in a URL; keep the first few to stay within limits.
    if (waypoints.length > 0) {
      params.set('waypoints', waypoints.slice(0, 9).map(coord).join('|'))
    }
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
