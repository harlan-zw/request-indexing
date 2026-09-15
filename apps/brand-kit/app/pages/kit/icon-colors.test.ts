import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(new URL('./icon-colors.vue', import.meta.url), 'utf8')
const designSystemApp = new URL('../../../../../layers/design-system/app/', import.meta.url)

describe('kit icon-colors page file labels', () => {
  it('only name files that exist in the design system layer', () => {
    const labels = [...pageSource.matchAll(/code="((?:composables|utils)\/[\w./-]+\.ts)"/g)].map(match => match[1])
    expect(labels.length).toBeGreaterThan(0)
    const missing = labels.filter(label => !existsSync(new URL(label, designSystemApp)))
    expect(missing).toEqual([])
  })
})
