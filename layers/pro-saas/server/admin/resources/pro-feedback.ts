import type { AdminCtx, AdminListQuery } from '../admin-shell'
import type { SQL, SQLWrapper } from 'drizzle-orm'
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm'
import { defineAdminResource } from '../admin-shell'
import { getUserDisplayMetaMap } from '../../../../pro-saas-auth/server/utils/auth/identity'
import { feedback, users } from '../../database/_surface'

interface ProFeedbackRow {
  id: string
  path: string
  thumb: 'up' | 'down' | null
  comment: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date | null
  userId: string | null
  subscriptionStatus: string | null
}

const sortableMap: Record<string, SQLWrapper> = {
  path: feedback.path,
  thumb: feedback.thumb,
  createdAt: feedback.createdAt,
  subscriptionStatus: users.subscriptionStatus,
}

export default defineAdminResource<ProFeedbackRow>({
  key: 'pro-feedback',
  label: 'Pro feedback',
  singular: 'Pro feedback',
  icon: 'i-lucide-thumbs-up',
  group: 'Pro features',
  perPage: 25,
  fields: [
    { type: 'text', key: 'path', label: 'Path', sortable: true, searchable: true },
    {
      type: 'badge',
      key: 'thumb',
      label: 'Sentiment',
      sortable: true,
      badgeMap: { up: 'success', down: 'error' },
    },
    { type: 'text', key: 'comment', label: 'Comment', searchable: true },
    {
      type: 'badge',
      key: 'subscriptionStatus',
      label: 'Subscription',
      sortable: true,
      badgeMap: {
        active: 'success',
        trial: 'info',
        past_due: 'warning',
        paused: 'warning',
        canceled: 'neutral',
        read_only: 'neutral',
        archived: 'neutral',
      },
    },
    {
      type: 'belongsTo',
      key: 'userId',
      label: 'User',
      belongsTo: { resource: 'users', labelKey: 'name' },
    },
    { type: 'json', key: 'metadata', label: 'Metadata', hideOnIndex: true },
    { type: 'datetime', key: 'createdAt', label: 'Submitted', sortable: true },
  ],
  cards: [
    {
      key: 'total',
      type: 'metric',
      label: 'Total feedback',
      load: async ({ db }) => {
        const result = await db.select({ n: count() }).from(feedback)
        return { value: result[0]?.n ?? 0 }
      },
    },
    {
      key: 'positive',
      type: 'metric',
      label: 'Thumbs up',
      load: async ({ db }) => {
        const result = await db.select({ n: count() }).from(feedback).where(eq(feedback.thumb, 'up'))
        return { value: result[0]?.n ?? 0 }
      },
    },
    {
      key: 'negative',
      type: 'metric',
      label: 'Thumbs down',
      load: async ({ db }) => {
        const result = await db.select({ n: count() }).from(feedback).where(eq(feedback.thumb, 'down'))
        return { value: result[0]?.n ?? 0 }
      },
    },
    {
      key: 'paying',
      type: 'metric',
      label: 'From paying users',
      load: async ({ db }) => {
        const result = await db
          .select({ n: count() })
          .from(feedback)
          .leftJoin(users, eq(feedback.userId, users.userId))
          .where(eq(users.subscriptionStatus, 'active'))
        return { value: result[0]?.n ?? 0 }
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
        title: 'Delete feedback?',
        body: 'This permanently removes the selected feedback entries.',
        confirmText: 'Delete',
      },
      handler: async ({ db }, rows) => {
        const ids = rows.map((r: ProFeedbackRow) => r.id)
        if (!ids.length)
          return
        await db.delete(feedback).where(inArray(feedback.id, ids))
        return { message: `Deleted ${ids.length} feedback entr${ids.length === 1 ? 'y' : 'ies'}` }
      },
    },
  ],
  index: async ({ db }: AdminCtx, q: AdminListQuery) => {
    const page = q.page ?? 1
    const perPage = q.perPage ?? 25
    const offset = (page - 1) * perPage

    const filters: SQL[] = []
    if (q.search) {
      const searchFilter = or(like(feedback.comment, `%${q.search}%`), like(feedback.path, `%${q.search}%`))
      if (searchFilter)
        filters.push(searchFilter)
    }
    const whereExpr = filters.length ? and(...filters) : undefined

    const orderCol = q.sort ? sortableMap[q.sort.key] : feedback.createdAt
    const order = q.sort?.dir === 'asc' ? asc(orderCol ?? feedback.createdAt) : desc(orderCol ?? feedback.createdAt)

    const [rows, totalRows] = await Promise.all([
      db.select({
        id: feedback.id,
        path: feedback.path,
        thumb: feedback.thumb,
        comment: feedback.comment,
        metadata: feedback.metadata,
        createdAt: feedback.createdAt,
        userId: feedback.userId,
        subscriptionStatus: users.subscriptionStatus,
      })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.userId))
        .where(whereExpr)
        .orderBy(order)
        .limit(perPage)
        .offset(offset),
      db.select({ n: count() }).from(feedback).where(whereExpr),
    ])
    const total = totalRows[0]?.n ?? 0

    const userIds = [...new Set(rows.map(r => r.userId).filter((id): id is string => Boolean(id)))]
    const meta = await getUserDisplayMetaMap(db, userIds)
    const userRels: Record<string, Record<string, unknown>> = {}
    for (const id of userIds) {
      const m = meta.get(id)
      if (m)
        userRels[id] = { id, name: m.name, email: m.email, avatarUrl: m.avatarUrl }
    }

    return {
      rows,
      total: total ?? 0,
      relations: { users: userRels },
    }
  },
  show: async ({ db }, id) => {
    const [row] = await db
      .select({
        id: feedback.id,
        path: feedback.path,
        thumb: feedback.thumb,
        comment: feedback.comment,
        metadata: feedback.metadata,
        createdAt: feedback.createdAt,
        userId: feedback.userId,
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.userId))
      .where(eq(feedback.id, id))
      .limit(1)
    return (row as ProFeedbackRow | undefined) ?? null
  },
  destroy: async ({ db }, id) => {
    await db.delete(feedback).where(eq(feedback.id, id))
  },
})
