import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'

const DUMP_DIR = join(import.meta.dirname!, '..', '.data', 'kv-dump')
const NAMESPACE_ID = process.env.KV_NAMESPACE_ID || '9ba09cd123b948f6835f5d20b2d97f6c'
const BATCH_SIZE = 2500

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const out: string[] = []
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory())
      out.push(...await walk(p))
    else if (e.isFile() && p.endsWith('.json'))
      out.push(p)
  }
  return out
}

function fileToKey(abs: string): string {
  const rel = relative(DUMP_DIR, abs).replace(/\.json$/, '')
  return rel.split(sep).join(':')
}

async function main() {
  const files = await walk(DUMP_DIR)
  console.log(`Found ${files.length} files`)

  const tmp = await mkdtemp(join(tmpdir(), 'kv-sync-'))
  console.log(`Staging in ${tmp}`)

  let pushed = 0
  let errors = 0

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    const items = await Promise.all(batch.map(async (f) => {
      const raw = await readFile(f, 'utf8')
      // Compact JSON if valid, else raw string
      let value: string
      try {
        value = JSON.stringify(JSON.parse(raw))
      }
      catch {
        value = raw
      }
      return { key: fileToKey(f), value }
    }))

    const batchFile = join(tmp, `batch-${i}.json`)
    await writeFile(batchFile, JSON.stringify(items))
    const sizeKB = ((await stat(batchFile)).size / 1024).toFixed(0)
    process.stdout.write(`\n[batch ${i / BATCH_SIZE + 1}] ${items.length} keys, ${sizeKB}KB -> uploading... `)

    try {
      execFileSync('wrangler', [
        'kv',
        'bulk',
        'put',
        batchFile,
        `--namespace-id=${NAMESPACE_ID}`,
        '--remote',
      ], { stdio: ['ignore', 'pipe', 'pipe'] })
      pushed += items.length
      process.stdout.write('ok')
    }
    catch (err: any) {
      errors += items.length
      process.stdout.write(`FAIL: ${err.message?.slice(0, 200)}`)
    }
  }

  console.log(`\n\nDone! ${pushed} pushed, ${errors} failed`)
  await rm(tmp, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
