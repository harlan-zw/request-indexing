export interface DashboardSiteSummarySource {
  getQueryTotal: () => Promise<number>
  getPageTotal: () => Promise<number>
}

export async function loadDashboardSiteSummary(source: DashboardSiteSummarySource) {
  const [queries, pages] = await Promise.all([
    source.getQueryTotal(),
    source.getPageTotal(),
  ])

  return { queries, pages }
}

export function resolveMetricDomain(values: number[]): [number, number] {
  const finiteValues = values.filter(Number.isFinite)
  if (!finiteValues.length)
    return [0, 1]

  const min = Math.min(...finiteValues)
  const max = Math.max(...finiteValues)
  const spread = max - min
  const magnitude = Math.max(Math.abs(min), Math.abs(max), 1)
  const padding = Math.max(spread * 0.08, magnitude * 0.02)

  return [min <= 0 ? 0 : min - padding, max + padding]
}

export function resolvePlotRange(height: number, inverted: boolean): [number, number] {
  const top = 8
  const bottom = Math.max(top + 1, height - 24)
  return inverted ? [top, bottom] : [bottom, top]
}
