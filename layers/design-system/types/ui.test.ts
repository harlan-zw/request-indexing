import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolveUiIcon } from '../shared/icons'

const unionSource = readFileSync(new URL('./ui.ts', import.meta.url), 'utf8')
const collection = JSON.parse(readFileSync(new URL('../../../node_modules/@iconify-json/heroicons/icons.json', import.meta.url), 'utf8')) as {
  icons: Record<string, unknown>
  aliases?: Record<string, unknown>
}

const grandfathered = new Set(['i-heroicons-outline-key'])

describe('iconClass heroicons literals', () => {
  it('all resolve to icons that exist in the installed heroicons collection', () => {
    const literals = [...new Set(unionSource.match(/i-heroicons-[a-z0-9-]+/g) ?? [])]
    expect(literals.length).toBeGreaterThan(0)
    const missing = literals
      .filter(literal => !grandfathered.has(literal))
      .map(literal => resolveUiIcon(literal)!)
      .filter((id) => {
        const name = id.slice('i-heroicons-'.length)
        return !collection.icons[name] && !collection.aliases?.[name]
      })
    expect(missing).toEqual([])
  })
})
