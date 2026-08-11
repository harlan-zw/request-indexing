import type { AdminCtx, AdminListQuery } from '../admin-shell'
import type { SQL, SQLWrapper } from 'drizzle-orm'
import { and, asc, count, desc, eq, isNull, like, or } from 'drizzle-orm'
import { defineAdminResource } from '../admin-shell'
import { getUserDisplayMetaMap } from '../../../../pro-saas-auth/server/utils/auth/identity'
import { users } from '../../database/_surface'

interface UserRow {
  id: string
  email: string | null
  name: string | null
  stripeEmail: string | null
  subscriptionStatus: string
  createdAt: Date | null
}

const sortableMap: Record<string, SQLWrapper> = {
  stripeEmail: users.stripeEmail,
  subscriptionStatus: users.subscriptionStatus,
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
    {
      type: 'badge',
      key: 'subscriptionStatus',
      label: 'Subscription',
      sortable: true,
      badgeMap: {
        active: 'success',
        canceled: 'error',
        none: 'neutral',
        trial: 'info',
        past_due: 'warning',
        paused: 'warning',
        read_only: 'warning',
        archived: 'error',
      },
    },
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
    {
      key: 'active',
      type: 'metric',
      label: 'Active',
      load: async ({ db }) => {
        const r = await db.select({ n: count() }).from(users).where(eq(users.subscriptionStatus, 'active'))
        return { value: r[0]?.n ?? 0 }
      },
    },
    {
      key: 'canceled',
      type: 'metric',
      label: 'Canceled',
      load: async ({ db }) => {
        const r = await db.select({ n: count() }).from(users).where(eq(users.subscriptionStatus, 'canceled'))
        return { value: r[0]?.n ?? 0 }
      },
    },
    {
      key: 'none',
      type: 'metric',
      label: 'No subscription',
      load: async ({ db }) => {
        const r = await db.select({ n: count() }).from(users).where(isNull(users.subscriptionStatus))
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
        like(users.stripeEmail, `%${q.search}%`),
        like(users.discordUsername, `%${q.search}%`),
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
        stripeEmail: users.stripeEmail,
        subscriptionStatus: users.subscriptionStatus,
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
      stripeEmail: r.stripeEmail,
      email: meta.get(r.id)?.email ?? r.stripeEmail ?? null,
      name: meta.get(r.id)?.name ?? null,
      subscriptionStatus: r.subscriptionStatus ?? 'none',
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
      email: meta?.email ?? row.stripeEmail ?? null,
      name: meta?.name ?? null,
      subscriptionStatus: row.subscriptionStatus ?? 'none',
    } as UserRow
  },
})
