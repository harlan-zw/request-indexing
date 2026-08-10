import { defineAdminPanel } from '#layers/pro-saas/server/admin/admin-shell'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('admin:resources', (r) => {
    r.addPanel(defineAdminPanel({
      key: 'gscdump',
      label: 'gscdump',
      icon: 'i-lucide-search',
      group: 'Analytics',
      to: '/admin/gscdump',
    }))
    r.addPanel(defineAdminPanel({
      key: 'gsc',
      label: 'Search Console',
      icon: 'i-lucide-search',
      group: 'Analytics',
      to: '/admin/gsc',
    }))
  })
})
