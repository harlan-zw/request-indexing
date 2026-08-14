import type { SQL, SQLWrapper } from 'drizzle-orm'
import type { AdminCtx, AdminListQuery } from '../admin-shell'
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm'
import { sites, users } from '../../database/_surface'
import { defineAdminResource } from '../admin-shell'

interface SiteRow {
  id: string
  name: string | null
  url: string | null
  userId: string
  createdAt: Date | null
}

const sortableMap: Record<string, SQLWrapper> = {
  name: sites.name,
  url: sites.url,
  createdAt: sites.createdAt,
}

export default defineAdminResource<SiteRow>({
  key: 'sites',
  label: 'Sites',
  singular: 'Site',
  icon: 'i-lucide-globe',
  group: 'People',
  perPage: 25,
  detailComponent: 'AdminSiteDetail',
  fields: [
    { type: 'text', key: 'name', label: 'Name', sortable: true, searchable: true },
    { type: 'url', key: 'url', label: 'URL', sortable: true, searchable: true },
    {
      type: 'belongsTo',
      key: 'userId',
      label: 'Owner',
      belongsTo: { resource: 'users', labelKey: 'email' },
    },
    { type: 'datetime', key: 'createdAt', label: 'Added', sortable: true },
  ],
  cards: [
    {
      key: 'total',
      type: 'metric',
      label: 'Total sites',
      load: async ({ db }) => {
        const r = await db.select({ n: count() }).from(sites)
        return { value: r[0]?.n ?? 0 }
      },
    },
  ],
  actions: [
    {
      key: 'destroy',
      label: 'Delete',
      variant: 'danger',
      batch: true,
      confirm: {
        title: 'Delete sites?',
        body: 'This permanently removes the selected sites.',
        confirmText: 'Delete',
      },
      handler: async ({ db }, rows) => {
        const ids = rows.map((r: SiteRow) => r.id)
        if (!ids.length)
          return
        await db.delete(sites).where(inArray(sites.id, ids))
        return { message: `Deleted ${ids.length} site(s)` }
      },
    },
  ],
  index: async ({ db }: AdminCtx, q: AdminListQuery) => {
    const page = q.page ?? 1
    const perPage = q.perPage ?? 25
    const offset = (page - 1) * perPage

    const filters: SQL[] = []
    if (q.search) {
      const searchFilter = or(
        like(sites.name, `%${q.search}%`),
        like(sites.url, `%${q.search}%`),
      )
      if (searchFilter)
        filters.push(searchFilter)
    }
    const whereExpr = filters.length ? and(...filters) : undefined

    const orderCol = q.sort ? sortableMap[q.sort.key] : sites.createdAt
    const order = q.sort?.dir === 'asc' ? asc(orderCol ?? sites.createdAt) : desc(orderCol ?? sites.createdAt)

    const [rows, totalRows] = await Promise.all([
      db.select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        userId: sites.userId,
        createdAt: sites.createdAt,
      })
        .from(sites)
        .where(whereExpr)
        .orderBy(order)
        .limit(perPage)
        .offset(offset),
      db.select({ n: count() }).from(sites).where(whereExpr),
    ])
    const total = totalRows[0]?.n ?? 0

    const userIds = [...new Set(rows.map(r => r.userId))]
    let userRels: Record<string, Record<string, unknown>> = {}
    if (userIds.length) {
      const relatedUsers = await db
        .select({ id: users.userId, email: users.email })
        .from(users)
        .where(inArray(users.userId, userIds))
      userRels = Object.fromEntries(relatedUsers.map(u => [u.id, { id: u.id, email: u.email ?? '' }]))
    }

    return {
      rows: rows as SiteRow[],
      total: total ?? 0,
      relations: { users: userRels },
    }
  },
  show: async ({ db }, id) => {
    const [row] = await db.select({
      id: sites.id,
      name: sites.name,
      url: sites.url,
      userId: sites.userId,
      createdAt: sites.createdAt,
    }).from(sites).where(eq(sites.id, id)).limit(1)
    return (row as SiteRow | undefined) ?? null
  },
  destroy: async ({ db }, id) => {
    await db.delete(sites).where(eq(sites.id, id))
  },
})
