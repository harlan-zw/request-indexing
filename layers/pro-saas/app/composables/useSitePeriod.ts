import { useProGscFilters } from '#layers/pro-gsc/app/composables/useProGscFilters'
/**
 * GSC-agnostic facade over `useProGscFilters()` for non-GSC consumers
 * (cwv, lighthouse, reports). Returns only the generic period selection
 * — `period`, `compareMode`, `stableData` — without leaking GSC column
 * state.
 *
 * The period state under the hood is shared via `useState` keys owned by
 * `useProGscFilters`, so changes from any caller (GSC date picker, a CWV
 * range select, a Lighthouse view) propagate to every other consumer.
 * This is intentional: the user's selected window is a session-level
 * concept, not a per-page one. Tabs share the same window.
 *
 * For period -> { from, to } resolution, consumers should call
 * `periodToDateRange(period.value, stableData.value)` from
 * `~~/layers/pro-gsc/app/composables/useGscPeriod`. The period vocabulary
 * (`'7d' | '28d' | ...` and `custom:...`) is the lingua franca per
 * ADR-0011, even though the algebra lives in pro-gsc.
 *
 * GSC-flavoured concerns (columns, zoomTo / resetZoom, preZoomPeriod,
 * column toggles) stay on `useProGscFilters` and remain the call site
 * for GSC consumers.
 */
export function useSitePeriod() {
  const { period, compareMode, stableData } = useProGscFilters()
  return { period, compareMode, stableData }
}
