import { useState } from 'nuxt/app'

/** Shared development-only skeleton toggle used by Pro data visualizations. */
export function useProDevSkeleton() {
  return useState<boolean>('pro:dev-skeleton', () => false)
}
