import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sites } from '../../../pro-saas/server/database/schema'

export const indexingInvestigations = sqliteTable('indexing_investigations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  siteId: text('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  issueType: text('issue_type').notNull(),
  status: text('status').notNull().default('investigated'),
  note: text('note'),
  investigatedAt: integer('investigated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('idx_investigation_site_url_issue').on(t.siteId, t.url, t.issueType),
])

export const indexingInvestigationsRelations = relations(indexingInvestigations, ({ one }) => ({
  site: one(sites, { fields: [indexingInvestigations.siteId], references: [sites.id] }),
}))

export type IndexingInvestigation = typeof indexingInvestigations.$inferSelect
export type NewIndexingInvestigation = typeof indexingInvestigations.$inferInsert
