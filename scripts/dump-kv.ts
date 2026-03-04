import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL!
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!
const OUT_DIR = join(import.meta.dirname!, '..', '.data', 'kv-dump')

async function redis(command: string[]) {
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    body: JSON.stringify(command),
  })
  const data = await res.json()
  if (data.error)
    throw new Error(data.error)
  return data.result
}

async function scanAll(pattern = '*', count = 200) {
  const keys: string[] = []
  let cursor = '0'
  do {
    const [nextCursor, batch] = await redis(['SCAN', cursor, 'MATCH', pattern, 'COUNT', String(count)])
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')
  return keys
}

async function writeKey(key: string, value: unknown) {
  // Convert key to file path: user:user-abc:me.json → user/user-abc/me.json
  const filePath = join(OUT_DIR, ...key.split(':'))
  // Ensure it ends with .json
  const finalPath = filePath.endsWith('.json') ? filePath : `${filePath}.json`
  await mkdir(dirname(finalPath), { recursive: true })

  let content: string
  if (typeof value === 'string') {
    // Try to parse as JSON for pretty printing
    try {
      content = JSON.stringify(JSON.parse(value), null, 2)
    }
    catch {
      content = value
    }
  }
  else {
    content = JSON.stringify(value, null, 2)
  }
  await writeFile(finalPath, content)
}

async function main() {
  console.log('Scanning all keys...')
  const keys = await scanAll()
  console.log(`Found ${keys.length} keys\n`)

  let done = 0
  let errors = 0

  // Process in batches of 20
  for (let i = 0; i < keys.length; i += 20) {
    const batch = keys.slice(i, i + 20)
    await Promise.all(
      batch.map(async (key) => {
        const value = await redis(['GET', key])
        await writeKey(key, value).catch((err) => {
          console.error(`  ERR ${key}: ${err.message}`)
          errors++
        })
        done++
      }),
    )
    process.stdout.write(`\r  ${done}/${keys.length} dumped (${errors} errors)`)
  }

  console.log(`\n\nDone! Files written to ${OUT_DIR}`)
}

main().catch(console.error)
