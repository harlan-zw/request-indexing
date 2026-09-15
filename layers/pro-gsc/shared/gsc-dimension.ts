/**
 * The Search Console breakdown slice a surface is ranked by. Owned here rather
 * than by a component so the control bar, the per-site route map and any
 * server-side caller share one name. `dates` is the time series; the other
 * three are entity breakdowns with their own routes.
 */
export type GscDimension = 'dates' | 'query' | 'page' | 'country'
