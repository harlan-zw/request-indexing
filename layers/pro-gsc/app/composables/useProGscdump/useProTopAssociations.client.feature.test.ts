import { expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

// The "Top page" column reads one association per row. Every cell used to wait
// on the slowest of them, which is how the column ended up permanently blank on
// a 25-row table. These tests drive the composable through its one seam and
// assert on what a single row's cell can render.

const resolvers = new Map<string, (value: { value: string | null }) => void>()

vi.mock('./useProGscdump', () => ({
  useProGscdump: () => ({
    getTopAssociation: ({ query }: { query: { identifier: string } }) =>
      new Promise<{ value: string | null }>((resolve) => {
        resolvers.set(query.identifier, resolve)
      }),
  }),
}))

const { useProTopAssociations } = await import('./useProTopAssociations')

function mount(keys: string[]) {
  const scope = effectScope()
  const result = scope.run(() => useProTopAssociations({
    gscdumpSiteId: ref('s_site'),
    range: ref({ start: '2026-08-01', end: '2026-08-28' }),
    group: 'queryCanonical',
    keys: ref(keys),
    concurrency: 25,
  }))!
  return { ...result, stop: () => scope.stop() }
}

it('renders a row as soon as its own association lands', async () => {
  const keys = ['alpha', 'beta', 'gamma']
  const { map, pendingFor, stop } = mount(keys)
  await nextTick()

  expect(keys.every(key => pendingFor(key))).toBe(true)

  resolvers.get('beta')!({ value: 'https://example.com/beta' })
  await vi.waitUntil(() => !pendingFor('beta'))

  expect(map.value.get('beta')).toBe('https://example.com/beta')
  expect(pendingFor('alpha')).toBe(true)
  expect(pendingFor('gamma')).toBe(true)
  stop()
})

it('settles a row with no association so the cell stops waiting', async () => {
  const { map, pending, pendingFor, stop } = mount(['solo'])
  await nextTick()

  resolvers.get('solo')!({ value: null })
  await vi.waitUntil(() => !pendingFor('solo'))

  expect(map.value.has('solo')).toBe(false)
  expect(pending.value).toBe(false)
  stop()
})
