import type { H3Event, SessionConfig } from 'h3'
import type { defuFn } from 'defu'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'
import type { UserSession } from '~/types'

export async function mergeUserSessionData(event: H3Event, data: Partial<UserSession>, merger: typeof defuFn) {
  const session = await _useSession(event)
  const fn = merger || defu
  await session.update(fn(data, session.data))
  return session.data
}

let sessionConfig: SessionConfig
function _useSession(event: H3Event) {
  sessionConfig = sessionConfig || defu<SessionConfig, SessionConfig[]>({ password: import.meta.env.NUXT_SESSION_PASSWORD }, useRuntimeConfig(event).session as SessionConfig)
  return useSession(event, sessionConfig)
}
