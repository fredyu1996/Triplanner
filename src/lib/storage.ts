import type { AppState, Checkpoint, Trip } from '../types'

const STORAGE_KEY = 'triplanner.state.v1'

const EMPTY_STATE: AppState = { trips: [], activeTripId: null }

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.trips)) return EMPTY_STATE
    return normalize(parsed)
  } catch {
    return EMPTY_STATE
  }
}

/** Backfill fields added in later versions so older saved data keeps working. */
function normalize(state: AppState): AppState {
  return {
    ...state,
    trips: state.trips.map((t): Trip => {
      const checkpoints = t.checkpoints.map((c): Checkpoint => ({
        ...c,
        day: c.day && c.day >= 1 ? c.day : 1,
        food: c.food ?? [],
        activities: c.activities ?? [],
      }))
      const maxDay = checkpoints.reduce((m, c) => Math.max(m, c.day), 1)
      return { ...t, days: Math.max(t.days ?? 1, maxDay), checkpoints }
    }),
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
        name: '京都週末遊(範例)',
        createdAt: Date.now(),
        days: 2,
        checkpoints: [
          {
            id: 'cp-1',
            name: '伏見稻荷大社',
            kind: 'place',
            lat: 34.9671,
            lng: 135.7727,
            notes: '著名的千本鳥居,建議一早去避開人潮。',
            visited: false,
            day: 1,
            order: 0,
            food: [],
            activities: [
              { id: 'a-1', name: '走完整條鳥居環迴山徑', note: '約 2 小時', done: false },
            ],
          },
          {
            id: 'cp-2',
            name: '錦市場',
            kind: 'restaurant',
            lat: 35.005,
            lng: 135.7649,
            notes: '京都的廚房 —— 一條有蓋的美食小街。',
            visited: false,
            day: 1,
            order: 1,
            food: [
              { id: 'f-1', name: '蛸玉子(糖漬章魚)', note: '街頭小食', ordered: false },
              { id: 'f-2', name: '豆乳冬甩', ordered: false },
              { id: 'f-3', name: '新鮮湯葉(豆皮)', note: '當地名物', ordered: false },
            ],
            activities: [],
          },
          {
            id: 'cp-3',
            name: '嵐山竹林',
            kind: 'activity',
            lat: 35.0094,
            lng: 135.6717,
            notes: '位於城市西面、高聳入雲的竹林小徑。',
            visited: false,
            day: 2,
            order: 0,
            food: [],
            activities: [
              { id: 'a-2', name: '漫步竹林小徑', done: false },
              { id: 'a-3', name: '在河上租木舟遊覽', note: '季節限定', done: false },
            ],
          },
        ],
      },
    ],
  }
  saveState(state)
  return state
}
