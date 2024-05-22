declare module 'nitropack' {
  import type { SiteSelect, TeamSelect } from '~/server/database/schema'

  type DynamicKeys = `ws:message:${string}`
  interface NitroRuntimeHooks {
    'app:user:created': (ctx: { userId: number }) => void | Promise<void>
    'app:site:created': (ctx: SiteSelect & { userId: number, permissionLevel: string }) => void | Promise<void>
    'app:team:sites-selected': (ctx: TeamSelect) => void | Promise<void>
    [key: DynamicKeys]: (ctx: any) => void | Promise<void>
  }
}
