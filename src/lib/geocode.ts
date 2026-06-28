// Place search via OpenStreetMap's Nominatim service.
// Free and key-free; runs from the user's browser (CORS-enabled).
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/

export interface GeoResult {
  id: string
  /** Short primary label, e.g. "Tokyo Tower". */
  name: string
  /** Full display address. */
  display: string
  lat: number
  lng: number
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim()
  if (!q) return []

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    'accept-language': 'zh-Hant',
  })

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`搜尋失敗 (${res.status})`)

  const data = (await res.json()) as Array<{
    place_id: number
    display_name: string
    name?: string
    lat: string
    lon: string
  }>

  return data.map((d) => ({
    id: String(d.place_id),
    name: d.name || d.display_name.split(',')[0],
    display: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
  }))
}
