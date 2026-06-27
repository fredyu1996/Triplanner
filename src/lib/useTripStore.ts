import { useEffect, useReducer } from 'react'
import type { AppState } from '../types'
import { loadState, saveState } from './storage'
import { reducer, type Action } from './store'

/** App-wide state backed by localStorage. */
export function useTripStore(): [AppState, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return [state, dispatch]
}
