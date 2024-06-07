import type { H3Event } from 'h3'
import { getQuery } from 'h3'

export function getQueryAsyncDataTable<T extends string>(e: H3Event) {
  // TODO validate
  const { filter, page, q, sort: _sort, pageSize: _pageSize } = getQuery<{
    filter: T
    page: string
    q: string
    sort: string
    pageSize?: number
  }>(e)
  const pageSize = _pageSize || 10
  const sort = JSON.parse(_sort)
  const offset = ((Number(page) || 1) - 1) * pageSize
  return {
    offset,
    filters: filter.split(','),
    page,
    q,
    sort,
    pageSize,
  }
}
