declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'app:user:created': (ctx: { env: Record<string, unknown>, userId: number }) => void | Promise<void>
    'app:site:created': (ctx: { env: Record<string, unknown>, siteId: number, userId: number, permissionLevel?: string, [key: string]: unknown }) => void | Promise<void>
    'app:team:sites-selected': (ctx: { env: Record<string, unknown>, teamId: number, [key: string]: unknown }) => void | Promise<void>
    'app:job:completed': (ctx: { env: Record<string, unknown>, jobId: string, taskName: string, siteId?: number, userId?: number, durationMs: number }) => void | Promise<void>
    'app:job:failed': (ctx: { env: Record<string, unknown>, jobId: string, taskName: string, error: string, attempt: number, permanent: boolean }) => void | Promise<void>
    'app:batch:progress': (ctx: { env: Record<string, unknown>, batchId: string, batchName?: string, completed: number, total: number, failed: number }) => void | Promise<void>
    'app:batch:complete': (ctx: { env: Record<string, unknown>, batchId: string, batchName?: string, total: number, failed: number }) => void | Promise<void>
    [key: `ws:message:${string}`]: (ctx: any) => void | Promise<void>
  }
}
