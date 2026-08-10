import { defineAdminPanel } from '#layers/pro-saas/server/admin/admin-shell'
import competitorsResource from '../admin/resources/competitors'
import feedbackResource from '../admin/resources/feedback'
import moduleConnectionsResource from '../admin/resources/module-connections'
import notificationsResource from '../admin/resources/notifications'
import proFeedbackResource from '../admin/resources/pro-feedback'
import sitesResource from '../admin/resources/sites'
import usersResource from '../admin/resources/users'
import waitlistResource from '../admin/resources/waitlist'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('admin:resources', (r) => {
    r.addResource(competitorsResource)
    r.addResource(feedbackResource)
    r.addResource(proFeedbackResource)
    r.addResource(notificationsResource)
    r.addResource(moduleConnectionsResource)
    r.addResource(waitlistResource)
    r.addResource(usersResource)
    r.addResource(sitesResource)
    r.addPanel(defineAdminPanel({
      key: 'pro-mcp',
      label: 'Pro MCP',
      icon: 'i-lucide-cpu',
      group: 'Analytics',
      to: '/admin/pro-mcp',
    }))
    r.addPanel(defineAdminPanel({
      key: 'emails',
      label: 'Emails',
      icon: 'i-lucide-mail',
      group: 'System',
      to: '/admin/emails',
    }))
  })
})
