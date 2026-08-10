/// <reference types="@cloudflare/workers-types" />
import type { H3Event } from 'h3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/_surface'

export { schema }

export function useProDB(event?: H3Event) {
  let db = (event?.context?.cloudflare?.env as { NUXT_SEO_PRO_DB?: D1Database } | undefined)?.NUXT_SEO_PRO_DB

  if (!db && typeof globalThis !== 'undefined') {
    const env = (globalThis as unknown as { __env__?: { NUXT_SEO_PRO_DB?: D1Database } }).__env__
    db = env?.NUXT_SEO_PRO_DB
  }

  if (!db) {
    throw new Error('D1 database binding not available')
  }
  return drizzle(db, { schema })
}
