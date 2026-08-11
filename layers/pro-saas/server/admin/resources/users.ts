import type { SQL, SQLWrapper } from 'drizzle-orm'
import type { AdminCtx, AdminListQuery } from '../admin-shell'
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm'
import { getUserDisplayMetaMap } from '../../../../pro-saas-auth/server/utils/auth/identity'
import { users } from '../../database/_surface'
import { defineAdminResource } from '../admin-shell'

interface UserRow {
  id: string
  email: string | null
  name: string | null
  createdAt: Date | null
}

const sortableMap: Record<string, SQLWrapper> = {
  email: users.email,
  createdAt: users.createdAt,
}

export default defineAdminResource<UserRow>({
  key: 'users',
  label: 'Users',
  singular: 'User',
  icon: 'i-lucide-users',
  group: 'People',
  perPage: 25,
  detailComponent: 'AdminUserDetail',
  fields: [
    { type: 'text', key: 'email', label: 'Email', searchable: true },
    { type: 'text', key: 'name', label: 'Name', searchable: true },
    { type: 'datetime', key: 'createdAt', label: 'Joined', sortable: true },
    { type: 'text', key: 'id', label: 'ID', hideOnIndex: true },
  ],
  cards: [
    {
      key: 'total',
      type: 'metric',
      label: 'Total users',
      load: async ({ db }) => {
        const r = await db.select({ n: count() }).from(users)
        return { value: r[0]?.n ?? 0 }
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
        like(users.email, `%${q.search}%`),
      )
      if (searchFilter)
        filters.push(searchFilter)
    }
    const whereExpr = filters.length ? and(...filters) : undefined

    const orderCol = q.sort ? sortableMap[q.sort.key] : users.createdAt
    const order = q.sort?.dir === 'asc' ? asc(orderCol ?? users.createdAt) : desc(orderCol ?? users.createdAt)

    const [rows, totalRows] = await Promise.all([
      db.select({
        id: users.userId,
        email: users.email,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(whereExpr)
        .orderBy(order)
        .limit(perPage)
        .offset(offset),
      db.select({ n: count() }).from(users).where(whereExpr),
    ])
    const total = totalRows[0]?.n ?? 0

    const ids = rows.map(r => r.id)
    const meta = ids.length ? await getUserDisplayMetaMap(db, ids) : new Map()

    const enriched: UserRow[] = rows.map(r => ({
      id: r.id,
      email: meta.get(r.id)?.email ?? r.email ?? null,
      name: meta.get(r.id)?.name ?? null,
      createdAt: r.createdAt,
    }))

    return { rows: enriched, total: total ?? 0 }
  },
  show: async ({ db }, id) => {
    const [row] = await db.select().from(users).where(eq(users.userId, id)).limit(1)
    if (!row)
      return null
    const meta = (await getUserDisplayMetaMap(db, [id])).get(id)
    return {
      ...row,
      email: meta?.email ?? row.email ?? null,
      name: meta?.name ?? null,
    } as UserRow
  },
})
