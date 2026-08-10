import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type ChatKind = 'public' | 'pro'
export type ChatScopeKindCol = 'all' | 'site' | 'group' | 'mixed'

export interface MessageUsage {
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  cacheCreationInputTokens?: number
}

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  userId: text('user_id').notNull(),
  kind: text('kind', { enum: ['public', 'pro'] }).$type<ChatKind>().notNull().default('public'),
  scopeKind: text('scope_kind', { enum: ['all', 'site', 'group', 'mixed'] }).$type<ChatScopeKindCol>(),
  defaultSiteId: text('default_site_id'),
  lastModel: text('last_model'),
  messageCount: integer('message_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$defaultFn(() => new Date()),
}, t => [
  index('chats_pro_user_updated_idx').on(t.userId, sql`${t.updatedAt} desc`).where(sql`${t.kind} = 'pro'`),
])

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}))

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  parts: text('parts', { mode: 'json' }).$type<unknown[]>(),
  aborted: integer('aborted', { mode: 'boolean' }).notNull().default(false),
  usage: text('usage', { mode: 'json' }).$type<MessageUsage>(),
  scopeSiteIds: text('scope_site_ids', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}))

export type Chat = typeof chats.$inferSelect
export type Message = typeof messages.$inferSelect
