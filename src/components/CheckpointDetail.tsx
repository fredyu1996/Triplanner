import { useState } from 'react'
import type { Checkpoint, CheckpointKind, Trip } from '../types'
import type { Action } from '../lib/store'
import { kindEmoji, kindLabel } from '../lib/labels'

interface Props {
  trip: Trip
  checkpoint: Checkpoint
  dispatch: React.Dispatch<Action>
  onClose: () => void
}

const KINDS: CheckpointKind[] = ['place', 'restaurant', 'activity']

export function CheckpointDetail({ trip, checkpoint: cp, dispatch, onClose }: Props) {
  const [foodName, setFoodName] = useState('')
  const [foodNote, setFoodNote] = useState('')
  const [activityName, setActivityName] = useState('')
  const [activityNote, setActivityNote] = useState('')

  const base = { tripId: trip.id, checkpointId: cp.id }

  return (
    <div className="detail">
      <div className="detail__top">
        <button className="detail__back" onClick={onClose}>
          ← 行程
        </button>
        <label className="detail__visited">
          <input
            type="checkbox"
            checked={cp.visited}
            onChange={() => dispatch({ type: 'toggleVisited', ...base })}
          />
          已到
        </label>
      </div>

      <input
        className="detail__name"
        value={cp.name}
        onChange={(e) => dispatch({ type: 'updateCheckpoint', ...base, patch: { name: e.target.value } })}
        placeholder="檢查點名稱"
      />

      <div className="detail__kinds">
        {KINDS.map((k) => (
          <button
            key={k}
            className={`chip ${cp.kind === k ? 'chip--active' : ''}`}
            onClick={() => dispatch({ type: 'updateCheckpoint', ...base, patch: { kind: k } })}
          >
            {kindEmoji(k)} {kindLabel(k)}
          </button>
        ))}
      </div>

      <textarea
        className="detail__notes"
        placeholder="備註 —— 地址、營業時間、訂位、交通方式⋯⋯"
        value={cp.notes}
        onChange={(e) => dispatch({ type: 'updateCheckpoint', ...base, patch: { notes: e.target.value } })}
        rows={3}
      />

      <p className="detail__coords">
        📍 {cp.lat.toFixed(5)}, {cp.lng.toFixed(5)}
      </p>

      {/* Food — what to order. Most relevant for restaurants but always available. */}
      <section className="detail__section">
        <h3>🍽️ 想點的菜 {cp.kind !== 'restaurant' && <span className="muted">(食物)</span>}</h3>
        {cp.food.length === 0 && <p className="empty">尚未加入。</p>}
        <ul className="checklist">
          {cp.food.map((f) => (
            <li key={f.id} className={f.ordered ? 'is-done' : ''}>
              <input
                type="checkbox"
                checked={f.ordered}
                onChange={() => dispatch({ type: 'updateFood', ...base, foodId: f.id, patch: { ordered: !f.ordered } })}
                aria-label={`標記 ${f.name} 為已點`}
              />
              <span className="checklist__text">
                {f.name}
                {f.note && <em className="checklist__note"> — {f.note}</em>}
              </span>
              <button className="checklist__del" onClick={() => dispatch({ type: 'deleteFood', ...base, foodId: f.id })} aria-label="移除">
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form
          className="add-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (!foodName.trim()) return
            dispatch({ type: 'addFood', ...base, name: foodName, note: foodNote })
            setFoodName('')
            setFoodNote('')
          }}
        >
          <input placeholder="想點的菜" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
          <input placeholder="備註(可選)" value={foodNote} onChange={(e) => setFoodNote(e.target.value)} />
          <button type="submit">加入</button>
        </form>
      </section>

      {/* Activities around the area. */}
      <section className="detail__section">
        <h3>🎯 附近活動</h3>
        {cp.activities.length === 0 && <p className="empty">尚未加入。</p>}
        <ul className="checklist">
          {cp.activities.map((a) => (
            <li key={a.id} className={a.done ? 'is-done' : ''}>
              <input
                type="checkbox"
                checked={a.done}
                onChange={() => dispatch({ type: 'updateActivity', ...base, activityId: a.id, patch: { done: !a.done } })}
                aria-label={`標記 ${a.name} 為完成`}
              />
              <span className="checklist__text">
                {a.name}
                {a.note && <em className="checklist__note"> — {a.note}</em>}
              </span>
              <button
                className="checklist__del"
                onClick={() => dispatch({ type: 'deleteActivity', ...base, activityId: a.id })}
                aria-label="移除"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form
          className="add-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (!activityName.trim()) return
            dispatch({ type: 'addActivity', ...base, name: activityName, note: activityNote })
            setActivityName('')
            setActivityNote('')
          }}
        >
          <input placeholder="活動" value={activityName} onChange={(e) => setActivityName(e.target.value)} />
          <input placeholder="備註(可選)" value={activityNote} onChange={(e) => setActivityNote(e.target.value)} />
          <button type="submit">加入</button>
        </form>
      </section>

      <button
        className="detail__delete"
        onClick={() => {
          if (confirm(`從行程中移除「${cp.name}」?`)) {
            dispatch({ type: 'deleteCheckpoint', ...base })
            onClose()
          }
        }}
      >
        🗑 刪除檢查點
      </button>
    </div>
  )
}
