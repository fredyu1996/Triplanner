import type { CheckpointKind } from '../types'

export function kindEmoji(kind: CheckpointKind): string {
  switch (kind) {
    case 'restaurant':
      return '🍜'
    case 'activity':
      return '🎢'
    default:
      return '📍'
  }
}

export function kindLabel(kind: CheckpointKind): string {
  switch (kind) {
    case 'restaurant':
      return '餐廳'
    case 'activity':
      return '活動'
    default:
      return '地點'
  }
}
