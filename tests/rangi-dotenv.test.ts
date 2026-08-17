import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { loadNuxt } from 'nuxt/kit'
import { afterAll, describe, expect, it } from 'vitest'

const fixtureRoot = await mkdtemp(join(process.cwd(), '.tmp-request-indexing-rangi-'))

afterAll(() => rm(fixtureRoot, { recursive: true, force: true }))

describe('dotenv highlighting', () => {
  it('renders an escaped multiline Google private key through the central parser', async () => {
    const modulePath = fileURLToPath(import.meta.resolve('@harlan-zw/comark-content'))
    const markdown = [
      '```dotenv',
      '# In .env files, wrap in quotes and keep the \\n characters',
      'GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n"',
      '```',
    ].join('\n')

    await mkdir(join(fixtureRoot, 'content'), { recursive: true })
    await Promise.all([
      writeFile(join(fixtureRoot, 'nuxt.config.mjs'), `export default { modules: [${JSON.stringify(modulePath)}], content: { highlight: true } }\n`),
      writeFile(join(fixtureRoot, 'content.config.mjs'), `export default { collections: { docs: { type: 'page', source: '*.md' } } }\n`),
      writeFile(join(fixtureRoot, 'content', 'key.md'), markdown),
    ])

    const nuxt = await loadNuxt({ cwd: fixtureRoot, dev: false, ready: true })
    await nuxt.close()

    const generatedDir = join(fixtureRoot, 'node_modules/.cache/comark-content/generated/docs')
    const readAsset = async <T>(path: string): Promise<T> =>
      JSON.parse(new TextDecoder().decode(gunzipSync(await readFile(join(generatedDir, path))))) as T
    const index = await readAsset<Array<{ bodyAsset: string }>>('index.json.gz')
    const body = await readAsset<{ nodes: unknown[][] }>(`body/${index[0]!.bodyAsset}`)
    const pre = body.nodes[0]
    const code = pre?.[2] as unknown[]
    const spans: Array<{ attributes: Record<string, unknown>, text: string }> = []
    const visit = (node: unknown) => {
      if (!Array.isArray(node))
        return
      if (node[0] === 'span' && typeof node[2] === 'string')
        spans.push({ attributes: (node[1] ?? {}) as Record<string, unknown>, text: node[2] })
      node.forEach(visit)
    }
    visit(code)

    expect(pre?.[0]).toBe('pre')
    expect(pre?.[1]).toMatchObject({ language: 'dotenv', class: expect.stringContaining('rangi shiki shj-lang-dotenv') })
    expect(code[0]).toBe('code')
    expect(spans.filter(span => span.text === 'GOOGLE_PRIVATE_KEY')).toEqual([
      { attributes: expect.objectContaining({ class: expect.stringContaining('shj-var') }), text: 'GOOGLE_PRIVATE_KEY' },
    ])
    expect(spans.filter(span => span.text.includes('-----BEGIN PRIVATE KEY-----'))).toEqual([
      { attributes: expect.objectContaining({ class: expect.stringContaining('shj-str') }), text: '"-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n"' },
    ])
  })
})
