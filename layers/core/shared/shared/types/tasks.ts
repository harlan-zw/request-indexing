export interface TaskMap {
  'users/send-welcome-email': { userId: number }
  'sites/setup': { siteId: number }
  'sites/sync-finished': { siteId: number }
  'teams/sync-selected': { teamId: number }
}

export type TaskName = keyof TaskMap
