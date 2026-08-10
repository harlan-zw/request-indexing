// Stub: depends on `siteCompetitors` table that hasn't been lifted into this
// monorepo's schema yet. Replace once the competitors feature ships.
import { defineAdminResource } from '../admin-shell'

export default defineAdminResource({
  key: 'competitors',
  label: 'Competitors',
  icon: 'i-lucide-users',
  fields: [],
  async list() {
    return { rows: [], total: 0 }
  },
})
