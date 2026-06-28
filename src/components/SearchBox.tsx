import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type GeoResult } from '../lib/geocode'

interface Props {
  /** Called when the user picks a result; should add it to the itinerary. */
  onPick: (result: GeoResult) => void
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'results'; items: GeoResult[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

const MIN_CHARS = 2

export function SearchBox({ onPick }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_CHARS) {
      setStatus({ kind: 'idle' })
      return
    }
    const controller = new AbortController()
    setStatus({ kind: 'loading' })
    setOpen(true)
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(q, controller.signal)
        setStatus(found.length > 0 ? { kind: 'results', items: found } : { kind: 'empty' })
        setOpen(true)
      } catch (e) {
        const err = e as Error
        if (err.name === 'AbortError') return
        setStatus({ kind: 'error', message: err.message || '搜尋失敗,請檢查網路連線。' })
        setOpen(true)
      }
    }, 450)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  // Close the dropdown when tapping / clicking outside.
  useEffect(() => {
    function onDocPointer(e: Event) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('touchstart', onDocPointer)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('touchstart', onDocPointer)
    }
  }, [])

  function pick(r: GeoResult) {
    onPick(r)
    setQuery('')
    setStatus({ kind: 'idle' })
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
          onFocus={() => status.kind !== 'idle' && setOpen(true)}
          aria-label="搜尋地點"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="search__clear"
            aria-label="清除"
            onClick={() => {
              setQuery('')
              setStatus({ kind: 'idle' })
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && status.kind !== 'idle' && (
        <div className="search__results">
          {status.kind === 'loading' && <p className="search__msg">🔎 搜尋中⋯⋯</p>}

          {status.kind === 'error' && <p className="search__msg search__msg--error">⚠️ {status.message}</p>}

          {status.kind === 'empty' && (
            <p className="search__msg">
              搵唔到「{query.trim()}」。試下換個關鍵字、加上城市名,或者用英文 / 羅馬拼音。
            </p>
          )}

          {status.kind === 'results' && (
            <ul>
              {status.items.map((r) => (
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
      )}
    </div>
  )
}
