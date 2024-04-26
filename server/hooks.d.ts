declare module 'nitropack' {
  import type { SiteSelect, TeamSelect, UserSelect } from '~/server/database/schema'

  interface NitroRuntimeHooks {
    'app:user:created': (ctx: UserSelect) => void | Promise<void>
    'app:site:created': (ctx: SiteSelect) => void | Promise<void>
    'app:team:sites-selected': (ctx: TeamSelect) => void | Promise<void>
  }
}
