import { defineCheck, fail, pass, unavailable } from '@harlan-zw/nuxt-checkin/server'
import { resolveCloudflareBindings } from '@harlan-zw/nuxt-cloudflare/bindings'

const BINDING = 'DB'
const TABLE = 'sites'
const REQUIRED_COLUMNS = ['id', 'public_id', 'team_id']

interface D1Binding {
  prepare: (statement: string) => { all: () => Promise<{ results?: Array<{ name?: unknown }> }> }
}

export default defineCheck({
  id: 'request-indexing.database',
  async run({ event, collect }) {
    const env = event ? resolveCloudflareBindings<{ DB?: D1Binding }>(event) : undefined
    const db = env?.DB
    if (typeof db?.prepare !== 'function')
      return unavailable('D1 binding is unavailable.')

    let tableInfo: Array<{ name?: unknown }>
    try {
      tableInfo = await collect(db, 'cloudflare.d1-schema', async () => {
        const result = await db.prepare(`PRAGMA table_info(${TABLE})`).all()
        return { value: result.results ?? [], metrics: { requests: 1 } }
      })
    }
    catch (error) {
      return fail(`The ${TABLE} schema query failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    const names = new Set(tableInfo.map(column => typeof column.name === 'string' ? column.name : ''))
    if (names.size === 0)
      return fail(`Table ${TABLE} is missing. Apply the pending D1 migrations.`)
    const missing = REQUIRED_COLUMNS.filter(column => !names.has(column))
    if (missing.length > 0)
      return fail(`Table ${TABLE} predates migration 0014 and is missing columns: ${missing.join(', ')}. Apply the pending D1 migrations.`, { table: TABLE, missing })
    return pass({ binding: BINDING, table: TABLE, requiredColumns: REQUIRED_COLUMNS })
  },
})
