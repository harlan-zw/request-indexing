import type { H3Event } from 'h3'
import type { useProDB } from '#layers/pro-saas/server/utils/pro-db'

export type AdminFieldType
  = | 'text'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'badge'
    | 'currency'
    | 'belongsTo'
    | 'json'
    | 'url'
    | 'user'

export type AdminBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface AdminFieldDef<T = unknown> {
  type: AdminFieldType
  key: string
  label?: string
  sortable?: boolean
  searchable?: boolean
  hideOnIndex?: boolean
  hideOnDetail?: boolean
  badgeMap?: Record<string, AdminBadgeVariant>
  currency?: string
  belongsTo?: { resource: string, labelKey: string }
  resolve?: (row: T) => unknown
}

export interface AdminListQuery {
  search?: string
  sort?: { key: string, dir: 'asc' | 'desc' }
  page?: number
  perPage?: number
  filters?: Record<string, unknown>
}

export interface AdminListResult<T = unknown> {
  rows: T[]
  total: number
  relations?: Record<string, Record<string, Record<string, unknown>>>
}

export interface AdminUser {
  id: string
  email: string
}

export interface AdminCtx {
  event: H3Event
  db: ReturnType<typeof useProDB>
  user: AdminUser
}

export interface AdminActionResult {
  message?: string
  redirect?: string
}

export interface AdminActionDef<T = unknown> {
  key: string
  label: string
  variant?: 'primary' | 'danger'
  confirm?: { title: string, body?: string, confirmText?: string }
  batch?: boolean
  authorize?: (ctx: AdminCtx, rows: T[]) => boolean | Promise<boolean>
  handler: (ctx: AdminCtx, rows: T[], params: Record<string, unknown>) => Promise<AdminActionResult | void>
}

export interface AdminCardData {
  value: number
  previous?: number
  series?: Array<{ x: string, y: number }>
}

export interface AdminCardDef {
  key: string
  type: 'metric' | 'trend' | 'partition'
  label: string
  load: (ctx: AdminCtx) => Promise<AdminCardData>
}

export interface AdminResourceDef<T = unknown> {
  key: string
  label: string
  singular: string
  icon: string
  group?: string
  perPage?: number
  fields: AdminFieldDef<T>[]
  cards?: AdminCardDef[]
  actions?: AdminActionDef<T>[]
  authorize?: (ctx: AdminCtx) => boolean | Promise<boolean>
  index: (ctx: AdminCtx, q: AdminListQuery) => Promise<AdminListResult<T>>
  show?: (ctx: AdminCtx, id: string) => Promise<T | null>
  destroy?: (ctx: AdminCtx, id: string) => Promise<void>
  /** Path to a bespoke detail component (resolved via addComponent). */
  detailComponent?: string
}

export interface AdminPanelDef {
  key: string
  label: string
  icon?: string
  group?: string
  to: string
  authorize?: (ctx: AdminCtx) => boolean | Promise<boolean>
}

export function defineAdminResource<T>(d: AdminResourceDef<T>): AdminResourceDef<T> { return d }
export function defineAdminPanel(d: AdminPanelDef): AdminPanelDef { return d }
export function defineAdminAction<T>(d: AdminActionDef<T>): AdminActionDef<T> { return d }
export function defineAdminCard(d: AdminCardDef): AdminCardDef { return d }

/* ── Client manifest (resolve/load/handler/etc stripped) ────────────────── */

export type AdminFieldManifest = Omit<AdminFieldDef, 'resolve'>

export interface AdminActionManifest {
  key: string
  label: string
  variant?: 'primary' | 'danger'
  confirm?: { title: string, body?: string, confirmText?: string }
  batch?: boolean
}

export interface AdminCardManifest {
  key: string
  type: AdminCardDef['type']
  label: string
}

export interface AdminResourceManifest {
  key: string
  label: string
  singular: string
  icon: string
  group?: string
  perPage?: number
  fields: AdminFieldManifest[]
  cards?: AdminCardManifest[]
  actions?: AdminActionManifest[]
  detailComponent?: string
}

export interface AdminManifest {
  resources: Record<string, AdminResourceManifest>
  panels: AdminPanelDef[]
}

export interface AdminRegistry {
  addResource: (r: AdminResourceDef) => void
  addPanel: (p: AdminPanelDef) => void
  getResource: (k: string) => AdminResourceDef | undefined
  getPanel: (k: string) => AdminPanelDef | undefined
  list: () => { resources: AdminResourceDef[], panels: AdminPanelDef[] }
}
