export interface TaskMap {
  'users/send-welcome-email': { userId: number }
  'users/sync-gsc-sites': { userId: number }
  'sites/setup': { siteId: number }
  'sites/sync-sitemap-pages': { siteId: number }
  'sites/sync-finished': { siteId: number }
  'teams/sync-selected': { teamId: number }
  'paths/run-psi': { siteId: number, path: string, strategy: 'mobile' | 'desktop' }
  'crux/history': { siteId: number, strategy: 'PHONE' | 'DESKTOP', path?: string }
  'keywords/adwords': { siteId: number, keywords: string[] }
}

export type TaskName = keyof TaskMap
