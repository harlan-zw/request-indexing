import { readdirSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The committed migrations are the only description of the live D1 schema, so
// the constraints they create are worth exercising. `POST /api/pro/sites`
// pre-checks a duplicate by `(team_id, domain)` and then inserts. If the
// database disagrees about what "duplicate" means, that insert throws a raw
// D1 error and onboarding dies with a 500 the user cannot read.
const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url))

function migratedDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  const files = readdirSync(MIGRATIONS_DIR).filter(name => name.endsWith('.sql')).sort()
  for (const name of files) {
    for (const statement of readFileSync(`${MIGRATIONS_DIR}/${name}`, 'utf8').split('--> statement-breakpoint')) {
      const sql = statement.trim()
      if (sql)
        db.exec(sql)
    }
  }
  return db
}

function seedTeam(db: DatabaseSync, teamId: number): void {
  db.exec(`INSERT INTO teams (team_id, public_id, name, personal_team) VALUES (${teamId}, 't_${teamId}', 'team-${teamId}', 1)`)
}

function insertSite(db: DatabaseSync, args: { id: string, publicId: string, teamId: number, domain: string }): void {
  db.prepare(
    'INSERT INTO sites (id, public_id, team_id, property, active, domain) VALUES (?, ?, ?, ?, 1, ?)',
  ).run(args.id, args.publicId, args.teamId, `https://${args.domain}/`, args.domain)
}

describe('sites ownership constraints', () => {
  it('lets two teams each connect the same domain', () => {
    const db = migratedDatabase()
    seedTeam(db, 1)
    seedTeam(db, 2)

    insertSite(db, { id: 'site-a', publicId: 's_aaaaaaaa', teamId: 1, domain: 'example.com' })

    expect(() => insertSite(db, { id: 'site-b', publicId: 's_bbbbbbbb', teamId: 2, domain: 'example.com' }))
      .not
      .toThrow()
  })

  it('refuses the same domain twice inside one team', () => {
    const db = migratedDatabase()
    seedTeam(db, 1)

    insertSite(db, { id: 'site-a', publicId: 's_aaaaaaaa', teamId: 1, domain: 'example.com' })

    expect(() => insertSite(db, { id: 'site-c', publicId: 's_cccccccc', teamId: 1, domain: 'example.com' }))
      .toThrow(/UNIQUE/i)
  })
})
