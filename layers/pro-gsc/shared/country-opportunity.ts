/**
 * Projection behind the country opportunity scatter.
 *
 * Kept out of the component so the two decisions that carry a bug class can be
 * read and tested on their own: the low-volume floor and the log-scale x axis.
 */

export interface CountryOpportunityRow {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface CountryOpportunityPoint extends CountryOpportunityRow {
  key: string
  /** Horizontal position, 0 to 100, percent of the plot area. */
  x: number
  /** Vertical position, 0 to 100, percent of the plot area. */
  y: number
  /** Marker diameter, px. */
  size: number
  /** Flag width, px. */
  iconPx: number
}

/**
 * CTR from a tiny sample is noise. A country with 2 clicks over 3 impressions
 * reads as 66 percent CTR and, being the maximum, sets the y-axis ceiling,
 * crushing every real country onto the floor.
 */
export const COUNTRY_OPPORTUNITY_MIN_IMPRESSIONS = 30

export interface CountryOpportunityProjection {
  points: CountryOpportunityPoint[]
  /** Countries dropped by the low-volume floor. */
  hiddenCount: number
}

/**
 * Place each country by reach against click-through rate.
 *
 * Countries under the impression floor are dropped first, unless the floor
 * would empty the plot: a small site whose best country is still under the
 * floor gets its unfiltered set rather than an empty chart.
 *
 * The x axis is log scale. Top countries span orders of magnitude, so a linear
 * axis would crush the long tail into the left edge. Both axes are inset to 6
 * to 94 percent so a marker never straddles an axis.
 */
export function projectCountryOpportunity(
  rows: readonly CountryOpportunityRow[],
): CountryOpportunityProjection {
  const filtered = rows.filter(row => (row.impressions ?? 0) >= COUNTRY_OPPORTUNITY_MIN_IMPRESSIONS)
  const data = filtered.length ? filtered : rows
  const hiddenCount = rows.length - data.length

  if (!data.length)
    return { points: [], hiddenCount: 0 }

  const logs = data.map(row => Math.log10(Math.max(row.impressions, 1)))
  const minLog = Math.min(...logs)
  const logSpan = (Math.max(...logs) - minLog) || 1
  const maxCtr = Math.max(...data.map(row => row.ctr), 0.0001)
  const maxClicks = Math.max(...data.map(row => row.clicks), 1)

  const points = data.map((row, i) => ({
    ...row,
    key: row.country,
    x: 6 + ((logs[i]! - minLog) / logSpan) * 88,
    y: 6 + (1 - row.ctr / maxCtr) * 88,
    // sqrt keeps area, not diameter, proportional to clicks.
    size: 14 + (Math.sqrt(row.clicks) / Math.sqrt(maxClicks)) * 32,
    iconPx: 10 + (Math.sqrt(row.clicks) / Math.sqrt(maxClicks)) * 14,
  }))

  return { points, hiddenCount }
}
