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
      return 'Restaurant'
    case 'activity':
      return 'Activity'
    default:
      return 'Place'
  }
}
