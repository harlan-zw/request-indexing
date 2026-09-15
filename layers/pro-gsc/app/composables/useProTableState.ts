import { useUrlSearchParams } from '@vueuse/core'
import { ref } from 'vue'

// Shared table state for the dashboard data tables: search text, page, preset
// filter and sort, plus the toggles that reset the page.
//
// Ported from nuxtseo.com `layers/saas/app/composables/useProAsyncTableData.ts`.

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

export function parseTableQueryPage(input: unknown): number {
  if (typeof input !== 'string' || input === '')
    return 1
  const page = Number(input)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function parseTableQueryString(input: unknown, fallback: string): string {
  return typeof input === 'string' && input ? input : fallback
}

export function useProTableState(options?: {
  defaultFilter?: string
  defaultSort?: TableSort
  initFromUrl?: boolean
}) {
  const { defaultFilter, defaultSort, initFromUrl } = options ?? {}

  let initialQ = ''
  let initialPage = 1
  let initialFilter = defaultFilter || 'default'

  if (initFromUrl) {
    const params = useUrlSearchParams('history', {
      removeNullishValues: true,
      removeFalsyValues: false,
    })
    initialQ = parseTableQueryString(params.q, '')
    initialPage = parseTableQueryPage(params.page)
    initialFilter = parseTableQueryString(params.filter, initialFilter)
  }

  const q = ref(initialQ)
  const page = ref(initialPage)
  const filter = ref(initialFilter)
  const sort = ref<TableSort>(defaultSort ? { ...defaultSort } : { column: 'clicks', direction: 'desc' })

  function toggleFilter(newFilter: string) {
    filter.value = filter.value === newFilter ? 'default' : newFilter
    page.value = 1
  }

  function setPage(newPage: number) {
    page.value = newPage
  }

  function setSort(column: string, direction: 'asc' | 'desc' = 'desc') {
    sort.value = { column, direction }
    page.value = 1
  }

  function toggleSort(column: string) {
    if (sort.value.column === column)
      sort.value = { column, direction: sort.value.direction === 'asc' ? 'desc' : 'asc' }
    else
      sort.value = { column, direction: 'desc' }
    page.value = 1
  }

  return { q, page, filter, sort, toggleFilter, setPage, setSort, toggleSort }
}
