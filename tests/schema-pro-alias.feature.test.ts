import { describe, expect, it } from 'vitest'
import { sites, users } from '#schema/pro'

// `modules/drizzle-layers` exists so nuxtseo.com server code that imports
// `#schema/pro` resolves here unchanged. The alias is the contract.
describe('#schema/pro', () => {
  it('serves the sites table through the aggregated barrel', () => {
    expect(sites.id.name).toBe('id')
    expect(sites.teamId.name).toBe('team_id')
  })

  it('serves every other table in the same database', () => {
    expect(users.userId.name).toBe('user_id')
  })
})
