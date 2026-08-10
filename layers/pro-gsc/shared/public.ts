// Public surface for cross-layer consumers of the gscdump Integration.
//
// Sibling layers (nuxt-seo-pro, pro-saas, pro-perf, …) MUST import gscdump
// types/values from this barrel, not deep-imported from `app/composables/*`.
// Enforced by ESLint `no-restricted-imports` against
// `~~/layers/pro-gsc/app/composables/*`.
//
// This barrel is server-safe: only pure types, pure functions, and pure
// data constants. Vue-runtime composables (e.g. `useGscFeatureDataState`)
// must be deep-imported from `app/composables/...` by app-scope consumers.
//
// Per ADR-0005 domain types live in `pro-saas/shared`. The contents here are
// **Integration**-shaped (gscdump wire types, period algebra) — owned by the
// pro-gsc layer, not the domain.

// Period algebra (pure functions over types, no Vue).
export type {
  CalendarPeriod,
  CompareMode,
  CustomPeriod,
  DateRangeResult,
  Period,
  RollingPeriod,
} from '../app/composables/useGscPeriod'
export {
  compareRange,
  isCustomPeriod,
  parseCustomPeriod,
  periodToDateRange,
  periodToDays,
} from '../app/composables/useGscPeriod'

// Filter UI primitives — pure constants + types, no Vue runtime.
export type { GscColumn, GscColumnOption, PeriodPreset } from '../app/composables/useProGscFilters'
export {
  COMPARE_OPTIONS,
  GSC_COLUMN_OPTIONS,
  GSC_PERIOD_OPTIONS,
  GSC_PERIOD_OPTIONS_LONG,
  PERIOD_PRESETS,
} from '../app/composables/useProGscFilters'

// Wire/data shapes (pure types, zero runtime).
export * from './gscdump-api'
