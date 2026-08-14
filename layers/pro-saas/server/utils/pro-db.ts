/// <reference types="@cloudflare/workers-types" />
import type { H3Event } from 'h3'
import { resolveCloudflareBindings } from '@harlan-zw/nuxt-cloudflare/bindings'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/_surface'

export { schema }

export function useProDB(event?: H3Event) {
  const db = resolveCloudflareBindings<{ NUXT_SEO_PRO_DB?: D1Database }>(event)?.NUXT_SEO_PRO_DB

  if (!db) {
    throw new Error('D1 database binding not available')
  }
  return drizzle(db, { schema })
}
