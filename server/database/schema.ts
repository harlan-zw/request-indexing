import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull().unique(),
  avatar: text('avatar').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

  lastLogin: integer('last_login', { mode: 'timestamp' }).notNull(),
  backupsEnabled: integer('backups_enabled').notNull().default(0),

  sub: text('sub').notNull().unique(),
  loginTokens: text('login_tokens').notNull(),

  sites: text('sites', { mode: 'json' }),
  selectedSites: text('selected_sites', { mode: 'json' }),
  onboardedStep: text('onboarded_step'),

  analyticsRange: text('analytics_range', { mode: 'json' }),
  analyticsPeriod: text('analytics_period'),

  indexingTokens: text('indexing_tokens', { mode: 'json' }),
  indexingOAuthId: text('indexing_oauth_id'),
  lastIndexingOAuthId: text('last_indexing_oauth_id'),
})

export const sites = sqliteTable('sites', {
  siteId: text('site_id').notNull().unique(),
  userId: text('user_id').notNull(),
  siteUrl: text('site_url').notNull(),
  siteName: text('site_name').notNull(),
  siteType: text('site_type').notNull(),
  siteVerified: integer('site_verified').notNull().default(0),
  siteSettings: text('site_settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  searchConsolePayload: text('search_console_payload', { mode: 'json' }),
})

export const siteUrlInspections = sqliteTable('site_url_inspections', {
  siteId: text('site_id').notNull(),
  url: text('url').notNull(),
  status: text('status').notNull(),
  payload: text('payload', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

