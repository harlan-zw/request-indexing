import { defineAdminPanel } from '#layers/pro-saas/server/admin/admin-shell'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('admin:resources', (r) => {
    r.addPanel(defineAdminPanel({
      key: 'chat',
      label: 'Pro Chat',
      icon: 'i-lucide-bot-message-square',
      group: 'Pro features',
      to: '/admin/chat',
    }))
  })
})
