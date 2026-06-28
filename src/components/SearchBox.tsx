import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type GeoResult } from '../lib/geocode'

interface Props {
  /** Called when the user picks a result; should add it to the itinerary. */
  onPick: (result: GeoResult) => void
}

export function SearchBox({ onPick }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setError(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const found = await searchPlaces(q, controller.signal)
        setResults(found)
        setOpen(true)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(r: GeoResult) {
    onPick(r)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="search" ref={boxRef}>
      <div className="search__field">
        <span className="search__icon" aria-hidden>
          🔍
        </span>
        <input
          type="text"
          value={query}
          placeholder="搜尋地點加入行程⋯⋯例如:東京鐵塔"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          aria-label="搜尋地點"
        />
        {loading && <span className="search__spin" aria-hidden>⏳</span>}
      </div>

      {open && (results.length > 0 || error) && (
        <ul className="search__results">
          {error && <li className="search__error">{error}</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button onClick={() => pick(r)}>
                <span className="search__name">📍 {r.name}</span>
                <span className="search__addr">{r.display}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
