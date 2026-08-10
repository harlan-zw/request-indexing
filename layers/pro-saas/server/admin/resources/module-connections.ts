// Stub: depends on `siteModules` table that hasn't been lifted into this
// monorepo's schema yet.
import { defineAdminResource } from '../admin-shell'

export default defineAdminResource({
  key: 'module-connections',
  label: 'Module connections',
  icon: 'i-lucide-plug',
  fields: [],
  async list() {
    return { rows: [], total: 0 }
  },
})
