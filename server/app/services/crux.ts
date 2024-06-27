import {withBase, withHttps, withTrailingSlash} from 'ufo'
import type { FetchError } from 'ofetch'
import { $fetch } from 'ofetch'
import { useRuntimeConfig } from '#imports'

const cwvKeys = [
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
  'first_contentful_paint',
  'first_input_delay',
  'experimental_time_to_first_byte',
] as const

export async function fetchCrux(domain: string, formFactor: 'PHONE' | 'TABLET' | 'DESKTOP' = 'PHONE', path = null) {
  const origin = withTrailingSlash(withHttps(domain))
  const body = {
    formFactor: formFactor.toUpperCase(),
  }
  if (path) {
    body['url'] = withHttps(withBase(path, domain))
  } else {
    body['origin'] = origin
  }
  const results = await $fetch(`/records:queryHistoryRecord`, {
    baseURL: 'https://chromeuxreport.googleapis.com/v1',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    query: {
      key: useRuntimeConfig().google.cruxApiToken,
    },
    body,
  }).catch((e: FetchError) => {
    // 404 is okay, it just means there's no data for this domain
    if (e.status === 404)
      return { exists: false }
    return e
  })

  if (results.exists === false)
    return results
  console.log(results?.record?.metrics?.interaction_to_next_paint?.percentilesTimeseries?.p75s)
  return normaliseCruxHistory(results.record, formFactor, !path)
}
interface CrUXHistoryResult {
  key: {
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET'
    origin: string
  }
  metrics: {
    [key in typeof cwvKeys[number]]: {
      histogramTimeseries: Array<{
        start: number | string
        end?: number | string
        densities: number[]
      }>
      percentilesTimeseries: {
        p75s: (number | null)[]
      }
    }
  }
  collectionPeriods: Array<{
    firstDate: {
      year: number
      month: number
      day: number
    }
    lastDate: {
      year: number
      month: number
      day: number
    }
  }>
}

interface NormalizedCrUXHistoryResult {
}

function normaliseCruxHistory(data: CrUXHistoryResult, formFactor: string, isOrigin = true): NormalizedCrUXHistoryResult {
  // we need to turn it into a time series data where we have each metric seperated into
  // an array like { value: number, time: number }[]
  // we also need to make sure that the data is sorted by time
  const {
    cumulative_layout_shift,
    largest_contentful_paint,
    interaction_to_next_paint,
    first_input_delay,
    first_contentful_paint,
    experimental_time_to_first_byte,
  } = data.metrics
  const dates = data.collectionPeriods.map(period => dayjs(new Date(period.firstDate.year, period.firstDate.month, period.firstDate.day)).format('YYYY-MM-DD'))
  function normaliseP75(segment, i) {
    // we should use the p75s data as the value
    return {
      value: Number.parseFloat(segment) || 0,
      date: dates[i],
    }
  }
  const cls = (cumulative_layout_shift?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const lcp = (largest_contentful_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const inp = (interaction_to_next_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const fid = (first_input_delay?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const fcp = (first_contentful_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const ttfb = (experimental_time_to_first_byte?.percentilesTimeseries?.p75s || []).map(normaliseP75)

  const clsStart = cls.findIndex(v => v.value >= 0)
  const lcpStart = lcp.findIndex(v => v.value > 0)
  const inpStart = inp.findIndex(v => v.value > 0)
  const fidStart = fid.findIndex(v => v.value > 0)
  const fcpStart = fcp.findIndex(v => v.value > 0)
  const ttfbStart = ttfb.findIndex(v => v.value > 0)
  const indexes = [
    clsStart,
    lcpStart,
    inpStart,
    fidStart,
    fcpStart,
    ttfbStart,
  ].filter(i => i > -1)
  if (!indexes.length)
    return { dates: [], cls: [], lcp: [], inp: [] }

  // we need to compute the first index that we'll start the data from
  // this index is the first index that has a value for all three data types above
  const start = Math.min(...indexes)
  // end should be the last index of a value greater than 0
  const end = Math.max(
    cls.findLastIndex(v => v.value >= 0),
    lcp.findLastIndex(v => v.value > 0),
    inp.findLastIndex(v => v.value > 0),
    fid.findLastIndex(v => v.value > 0),
    fcp.findLastIndex(v => v.value > 0),
    ttfb.findLastIndex(v => v.value > 0),
  )

  const prefix = formFactor === 'PHONE' ? `mobile${isOrigin ? 'Origin' : ''}` : `${formFactor.toLowerCase()}${isOrigin ? 'Origin' : ''}`
  return dates.slice(start, end).map((date) => {
    return {
      date,
      [`${prefix}Cls75`]: cls.find(v => v.date === date)?.value,
      [`${prefix}Lcp75`]: lcp.find(v => v.date === date)?.value,
      [`${prefix}Inp75`]: inp.find(v => v.date === date)?.value,
      [`${prefix}Fid75`]: fid.find(v => v.date === date)?.value,
      [`${prefix}Fcp75`]: fcp.find(v => v.date === date)?.value,
      [`${prefix}Ttfb75`]: ttfb.find(v => v.date === date)?.value,
    }
  })
}
