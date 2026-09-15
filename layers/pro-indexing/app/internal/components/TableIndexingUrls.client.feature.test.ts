import type { PropType, VNodeChild } from 'vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

// The URLs table is where the Canonicals page went: `?facet=canonical_mismatch`
// is meant to narrow the same rows rather than open a different report. These
// tests drive it through the one seam it fetches on, the indexing URLs query,
// and assert on what a reader ends up seeing.

const rows = [
  { url: 'https://example.com/a', verdict: 'PASS', coverageState: 'Submitted and indexed', canonicalMismatchKind: 'none', lastCrawlTime: '2026-09-01T00:00:00.000Z', userCanonical: null, googleCanonical: null, richResultsVerdict: null },
  { url: 'https://example.com/b', verdict: 'FAIL', coverageState: 'Crawled - currently not indexed', canonicalMismatchKind: 'path', lastCrawlTime: null, userCanonical: 'https://example.com/b', googleCanonical: 'https://example.com/b/', richResultsVerdict: null },
  { url: 'https://example.com/c', verdict: 'FAIL', coverageState: 'Duplicate without canonical', canonicalMismatchKind: 'cross_domain', lastCrawlTime: null, userCanonical: 'https://example.com/c', googleCanonical: 'https://other.test/c', richResultsVerdict: null },
]

const query = ref<Record<string, string>>({})
const replace = vi.fn()

vi.mock('#layers/pro-gsc/app/composables/useProGscdump', () => ({
  useProGscdumpIndexingUrls: () => ({
    data: ref({ urls: rows, pagination: { total: rows.length, limit: 25, offset: 0, hasMore: false }, meta: { siteUrl: 'https://example.com', status: 'ok', issue: null } }),
    status: ref('success'),
    error: ref(null),
    refresh: vi.fn(),
  }),
}))

vi.mock('#layers/design-system/app/components/element/UiStatusBadge.vue', () => ({
  default: defineComponent({
    props: { label: String },
    setup: props => () => h('span', { class: 'badge' }, props.label),
  }),
}))

vi.mock('#layers/design-system/app/components/element/UiUrlLabel.vue', () => ({
  default: defineComponent({
    props: { url: String },
    setup: props => () => h('a', { href: props.url }, props.url),
  }),
}))

// The shell owns search, filters and load-more. Here it only has to render the
// columns the table hands it, so the assertions are about those.
interface StubColumn {
  header: () => VNodeChild
  cell: (context: { row: { original: Record<string, unknown> } }) => VNodeChild
}

vi.mock('#layers/pro-gsc/app/components/pro/ProGscTableShell.vue', () => ({
  default: defineComponent({
    props: {
      columns: { type: Array as PropType<StubColumn[]>, default: () => [] },
      tableData: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    },
    setup: props => () => h('table', [
      h('thead', [h('tr', props.columns.map(column => h('th', [column.header()])))]),
      h('tbody', props.tableData.map(row =>
        h('tr', props.columns.map(column => h('td', [column.cell({ row: { original: row } })]))),
      )),
    ]),
  }),
}))

const globals = globalThis as Record<string, unknown>
globals.useRoute = () => ({ query: query.value, path: '/pro/dashboard/sites/s_1/indexing/urls' })
globals.useRouter = () => ({ replace })

const { default: TableIndexingUrls } = await import('./TableIndexingUrls.vue')

function mount(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(TableIndexingUrls as Parameters<typeof createApp>[0], {
    gscdumpSiteId: 'gsc_1',
    ...props,
  })
  for (const name of ['ProPageZone', 'ProSectionHeader', 'UiChip', 'UiButton']) {
    app.component(name, defineComponent({
      props: { title: String, label: String, badge: [String, Number] },
      setup: (props, { slots }) => () => h('div', { 'data-stub': name }, [
        props.title ?? props.label ?? '',
        String(props.badge ?? ''),
        slots.default?.(),
      ]),
    }))
  }
  app.mount(host)
  return host
}

beforeEach(() => {
  query.value = {}
  replace.mockClear()
})

it('renders one row per inspected URL', () => {
  const host = mount({})
  expect(host.querySelectorAll('tbody tr')).toHaveLength(3)
  expect([...host.querySelectorAll('tbody tr td:first-child a')].map(a => a.getAttribute('href')))
    .toEqual(['https://example.com/a', 'https://example.com/b', 'https://example.com/c'])
})

it('narrows to the canonical conflicts under the canonical facet', () => {
  const host = mount({ initialFacet: 'canonical_mismatch' })
  const urls = [...host.querySelectorAll('tbody tr td:first-child a')].map(a => a.getAttribute('href'))
  expect(urls).toEqual(['https://example.com/b', 'https://example.com/c'])
})

it('shows both canonicals and the kind of difference under the canonical facet', () => {
  const host = mount({ initialFacet: 'canonical_mismatch' })
  const headers = [...host.querySelectorAll('thead th')].map(th => th.textContent)
  expect(headers).toEqual(['URL', 'Verdict', 'Your canonical', 'Google picked', 'Difference', 'Coverage', 'Last crawl'])
  const lastRow = [...host.querySelectorAll('tbody tr')].at(-1)!
  expect(lastRow.textContent).toContain('https://other.test/c')
  expect(lastRow.textContent).toContain('Different domain')
})

it('keeps the plain table free of the canonical columns', () => {
  const host = mount({})
  const headers = [...host.querySelectorAll('thead th')].map(th => th.textContent)
  expect(headers).toEqual(['URL', 'Verdict', 'Coverage', 'Last crawl'])
})

it('reports no rows under the rich results facet when nothing carries a verdict', () => {
  const host = mount({ initialFacet: 'rich_results' })
  expect(host.querySelectorAll('tbody tr')).toHaveLength(0)
})

it('names the issue it is filtered to', () => {
  const host = mount({ initialIssue: 'crawled_not_indexed' })
  expect(host.textContent).toContain('Crawled not indexed')
})
