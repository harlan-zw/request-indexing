import type { MaybeRefOrGetter } from 'vue'
import type { ProjectedPositionSeries } from '../../../shared/utils/gsc-series'
import { computed, ref, toValue } from 'vue'
import { projectPositionSeries } from '../../../shared/utils/gsc-series'
import { useProEntitySparklines } from './useProEntitySparklines'

export { projectPositionSeries }

/**
 * Lazy position-over-time series for the query label's rank badges.
 *
 * Nothing fetches on render. A badge hover is what asks for that row's series,
 * and hovered keys accumulate into the key set, so `useProEntitySparklines`
 * issues one read per newly hovered term and nothing at all for a re-hover.
 *
 * The series is re-projected here because zero-filling is wrong for position. A
 * day with no impressions has no rank at all, and plotting it as 0 draws a dive
 * to the chart floor that reads as the best possible ranking. So unobserved
 * days carry the last observed rank forward, and the run before the first
 * observation is dropped along with its slice of the date axis.
 */
export interface UseProQueryPositionSparklinesOptions {
  /** gscdump site id. Single-site surfaces only. */
  gscdumpSiteId: MaybeRefOrGetter<string | null | undefined>
  range: MaybeRefOrGetter<{ start: string, end: string }>
  /** Dimension the row keys are drawn from. Defaults to the canonical form. */
  dimension?: 'query' | 'queryCanonical'
}

export interface ProQueryPositionSparklines {
  /** Registers a term for its next scan. */
  open: (entity: string) => void
  /** The row's series, `undefined` until the term has been opened and resolved. */
  seriesFor: (entity?: string | null) => number[] | undefined
  /** The row's dates, aligned 1:1 with `seriesFor`. */
  datesFor: (entity?: string | null) => string[] | undefined
  /** Whether the row is still resolving. */
  loadingFor: (entity?: string | null) => boolean
}

export function useProQueryPositionSparklines(
  options: UseProQueryPositionSparklinesOptions,
): ProQueryPositionSparklines {
  const dimension = options.dimension ?? 'queryCanonical'

  // Empty until a badge is hovered, so the underlying watcher short-circuits
  // and no request fires on mount.
  const opened = ref<string[]>([])

  const { map, dates, pending } = useProEntitySparklines({
    gscdumpSiteId: options.gscdumpSiteId,
    range: options.range,
    dimension,
    keys: opened,
    metric: 'position',
  })

  const projected = computed(() => {
    const axis = dates.value
    const out = new Map<string, ProjectedPositionSeries>()
    for (const [key, series] of map.value) {
      const p = projectPositionSeries(series, axis)
      if (p)
        out.set(key, p)
    }
    return out
  })

  return {
    open(entity) {
      if (!entity || opened.value.includes(entity))
        return
      opened.value = [...opened.value, entity]
    },
    seriesFor(entity) {
      return entity ? projected.value.get(entity)?.values : undefined
    },
    datesFor(entity) {
      return entity ? projected.value.get(entity)?.dates : undefined
    },
    loadingFor(entity) {
      if (!entity || !toValue(pending))
        return false
      // Only rows that were actually asked for read as loading.
      return opened.value.includes(entity) && !projected.value.has(entity)
    },
  }
}
