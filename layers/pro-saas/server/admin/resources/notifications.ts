// Stub: notifications admin resource. The full implementation depends on the
// notifications module shipping in this monorepo; placeholder keeps the
// admin-resources plugin compiling until that wiring lands.

import { defineAdminResource } from '../admin-shell'

export default defineAdminResource({
  key: 'notifications',
  label: 'Notifications',
  icon: 'i-lucide-bell',
  fields: [],
  async list() {
    return { rows: [], total: 0 }
  },
})
