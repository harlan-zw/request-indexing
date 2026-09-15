import { format } from 'date-fns'

export type FigureType = 'integer' | 'number' | 'date' | 'currency' | 'percent'

/**
 * Old formatting function
 *
 * @deprecated Please use formatValue() instead
 *
 * Adapted from https://github.com/elastic/numeral-js/blob/kibana-fork/numeral.js
 *
 * @param value
 * @param type
 * @param isWhole
 * @param _decimals
 */
export function formatFigure(
  value: number | string,
  type: FigureType,
  // TODO this api is getting quite bad but we want to avoid breaking changes for now, refactor to object options
  isWhole?: boolean,
  _decimals?: number,
) {
  let suffix = ''
  let count
  let decimals = _decimals || 2

  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value)
  const abs = Math.abs(numericValue)

  if (abs >= 10 ** 12) {
    // trillion
    suffix = 'T'
    count = numericValue / 10 ** 12
  }
  else if (abs < 10 ** 12 && abs >= 10 ** 9) {
    // billions
    suffix = 'B'
    count = numericValue / 10 ** 9
  }
  else if (abs < 10 ** 9 && abs >= 10 ** 6) {
    // millions
    suffix = 'M'
    count = numericValue / 10 ** 6
  }
  else if (abs < 10 ** 6 && abs >= 10 ** 4) {
    // > 10,000
    suffix = 'K'
    count = numericValue / 10 ** 3
  }
  else if (abs < 10000 && numericValue > 100) {
    count = numericValue
  }
  else {
    count = numericValue
    decimals = _decimals || 4
  }

  const isInteger = isWhole || type === 'integer'
  if (isInteger) {
    decimals = _decimals || 0
  }

  switch (type) {
    case 'integer':
    case 'number':
      return `${Number(count).toLocaleString(undefined, {
        [isInteger ? 'maximumFractionDigits' : 'minimumFractionDigits']: decimals,
      })}${suffix}`
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(count) + suffix
    case 'percent':
      // providing decimal override
      if (_decimals) {
        // TODO API around this not good, need to improve
        return `${Number(count).toLocaleString(undefined, {
          [isInteger ? 'maximumFractionDigits' : 'minimumFractionDigits']: _decimals,
        })}${suffix}%`
      }
      return `${numericValue.toLocaleString()}%`
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// single formatters
// ---------------------------------------------------------------------------------------------------------------------

type DateFormat = 'datetime' | 'date' | 'month' | 'year'

/**
 * Format date and optionally time in human-readable format
 *
 * @example Apr 19, 2024
 * @example Apr 19, 2024 - 12:35 AM GMT+1
 *
 * @param timestamp
 * @param fmt
 *
 * @deprecated Use formatValue() instead
 */
export function formatDate(timestamp: number | string | undefined, fmt: DateFormat = 'date'): string {
  const formats = {
    datetime: 'LLL dd, yyyy - h:mm a O',
    date: 'LLL dd, yyyy',
    month: 'LLL \'\'yy',
    year: 'yyyy',
  }
  try {
    return format(new Date(timestamp || ''), formats[fmt])
  }
  catch {
    return String(timestamp)
  }
}
