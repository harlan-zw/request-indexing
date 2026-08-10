import { defineAdminPanel } from '#layers/pro-saas/server/admin/admin-shell'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('admin:resources', (r) => {
    r.addPanel(defineAdminPanel({
      key: 'stripe',
      label: 'Stripe',
      icon: 'i-simple-icons-stripe',
      group: 'Billing',
      to: '/admin/stripe',
    }))
  })
})
