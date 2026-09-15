export interface TaskMap {
  'users/send-welcome-email': { userId: number }
  'sites/setup': { siteId: string }
  'sites/sync-finished': { siteId: string }
  'teams/sync-selected': { teamId: number }
}

export type TaskName = keyof TaskMap
