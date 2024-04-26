import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { customAlphabet } from 'nanoid'
import { relations, sql } from 'drizzle-orm'
import type { Credentials } from 'google-auth-library'
import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import type { RequiredNonNullable } from '~/types/util'

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const length = 12

const nanoid = customAlphabet(alphabet, length)

export const teams = sqliteTable('teams', {
  teamId: integer('team_id').notNull().primaryKey(),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  personalTeam: integer('personal_team', { mode: 'boolean' }).notNull().default(true),
  name: text('name').notNull(),
  backupsEnabled: integer('backups_enabled').notNull().default(0),
  onboardedStep: text('onboarded_step'),
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const users = sqliteTable('users', {
  userId: integer('user_id').notNull().primaryKey(),
  publicId: text('public_id').notNull().$defaultFn(nanoid),

  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar').notNull(),

  authPayload: text('auth_payload', { mode: 'json' }),
  lastLogin: integer('last_login').notNull(),
  sub: text('sub').notNull().unique(),
  loginTokens: text('login_tokens', { mode: 'json' }).notNull().$type<Credentials>(),

  analyticsRange: text('analytics_range', { mode: 'json' }),
  analyticsPeriod: text('analytics_period'),

  indexingTokens: text('indexing_tokens', { mode: 'json' }),
  indexingOAuthId: text('indexing_oauth_id'),
  lastIndexingOAuthId: text('last_indexing_oauth_id'),

  currentTeamId: integer('current_team_id').notNull().references((): AnySQLiteColumn => teams.teamId),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const sessions = sqliteTable('sessions', {
  sessionId: integer('session_id').notNull().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.userId),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  payload: text('payload', { mode: 'json' }),
  lastActivity: integer('last_activity'),
}, t => ({
  unq: unique().on(t.userId, t.ipAddress, t.userAgent), // avoid duplicate sessions for same device
}))

export type TeamSelect = typeof teams.$inferSelect

export const teamUser = sqliteTable('team_user', {
  teamId: integer('team_id').notNull().references(() => teams.teamId),
  userId: integer('user_id').notNull().references(() => users.userId),
  role: text('role'),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  unq: unique().on(t.teamId, t.userId),
}))

export const teamUserInvite = sqliteTable('team_user_invite', {
  // invite is token based not email
  inviteId: text('invite_id').notNull().primaryKey(),
  teamId: integer('team_id').notNull(),
  email: text('email').notNull(),
  role: text('role'),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export type UserSelect = typeof users.$inferSelect

export const sites = sqliteTable('sites', {
  siteId: integer('site_id').notNull().primaryKey(),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  property: text('property').notNull(),
  // hides domain properties which we've split into multiple sites
  active: integer('active', { mode: 'boolean' }).notNull().default(false),
  // isDomainProperty: integer('is_domain_property', { mode: 'boolean' }).notNull().default(false),
  sitemaps: text('sitemaps', { mode: 'json' }).$type<RequiredNonNullable<searchconsole_v1.Schema$WmxSitemap>[]>(),

  // for split domain properties
  domain: text('domain'),
  parentId: integer('parent_id').references((): AnySQLiteColumn => sites.siteId),
  // meta
  // pageCount30Day: integer('page_count_30_day'),
  // isLosingData: integer('is_losing_data', { mode: 'boolean' }),
  // startOfData: integer('start_of_data'),
  // siteSettings: text('site_settings', { mode: 'json' }),
  // searchConsolePayload: text('search_console_payload', { mode: 'json' }),

  lastSynced: integer('last_synced'),
  ownerId: integer('owner_id').references((): AnySQLiteColumn => users.userId),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export type SiteInsert = typeof sites.$inferInsert
export type SiteSelect = typeof sites.$inferSelect

export const siteUrls = sqliteTable('site_urls', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  path: text('path').notNull(),
  lastInspected: integer('last_inspected'),
  status: text('status'),
  payload: text('payload', { mode: 'json' }),
  // indexing api
  isIndexed: integer('is_indexed', { mode: 'boolean' }).notNull().default(false),
  // psi api
  psiDesktopScore: text('psi_desktop_score', { mode: 'json' }),
  psiMobileScore: text('psi_mobile_score', { mode: 'json' }),
  // gsc api
  keyword: text('keyword'),
  keywordPosition: integer('keyword_position').default(0),
  clicks: integer('clicks').default(0),
  prevClicks: integer('prev_clicks').default(0),
  clicksPercent: integer('clicks_percent').default(0),
  impressions: integer('impressions').default(0),
  impressionsPercent: integer('impressions_percent').default(0),
  prevImpressions: integer('prev_impressions').default(0),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  pathIdx: index('path_site_url_idx').on(t.path),
  unq: unique().on(t.siteId, t.path),
}))

export type SiteUrlSelect = typeof siteUrls.$inferSelect

export const siteDateAnalytics = sqliteTable('site_date_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path

  // google search console
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  ctr: integer('ctr').default(0),
  position: integer('position').default(0),
  // web indexing
  indexedPercent: integer('indexedPercent').default(0),
  pagesCount: integer('indexed').default(0),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  unq: unique().on(t.siteId, t.date),
}))

// allow users to hide sites within a team dashboard, also track their permission level to a site
export const userSites = sqliteTable('user_sites', {
  userId: integer('user_id').notNull().references(() => users.userId),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  permissionLevel: text('permission_level'),
}, t => ({
  unq: unique().on(t.userId, t.siteId),
}))

export type UserSitesSelect = typeof userSites.$inferSelect
export type UserSitesInsert = typeof userSites.$inferInsert

// multiple users and access a single site
export const teamSites = sqliteTable('team_sites', {
  teamId: integer('team_id').notNull().references(() => teams.teamId),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  // site can be linked to a team but may not be enabled due to
  // free tier can only have 6 active, need to manually be enabled
  // active: integer('active', { mode: 'boolean' }).notNull().default(false),
}, t => ({
  unq: unique().on(t.teamId, t.siteId),
}))

export type TeamSitesSelect = typeof teamSites.$inferSelect
export type TeamSitesInsert = typeof teamSites.$inferInsert

export const jobs = sqliteTable('jobs', {
  jobId: integer('job_id').notNull().primaryKey(),
  queue: text('queue').notNull(),
  // as json
  entityId: integer('entity_id'),
  entityType: text('entity_type'),
  name: text('name').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  // default 0
  attempts: integer('attempts').notNull().default(0),
  // reservedAt: integer('reserved_at'),
  availableAt: integer('available_at'),
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  queueIdx: index('queue_idx').on(t.queue),
}))

export type JobInsert = typeof jobs.$inferSelect
export type JobSelect = typeof jobs.$inferSelect

export const failedJobs = sqliteTable('failed_jobs', {
  failedJobId: integer('failed_job_id').notNull().primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.jobId),
  exception: text('exception', { mode: 'json' }).notNull(),
  failedAt: integer('failed_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.userId],
  }),
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  teams: many(teams),
  urlAnalytics: many(siteDateAnalytics),
  userSites: many(userSites, { relationName: 'sites_users' }),
  teamSites: many(teamSites),
  owner: one(users, {
    fields: [sites.ownerId],
    references: [users.userId],
  }),
  ownerPermissions: one(userSites, {
    fields: [sites.ownerId, sites.siteId],
    references: [userSites.userId, userSites.siteId],
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.currentTeamId],
    references: [teams.teamId],
  }),
  sessions: many(sessions),
  userSites: many(userSites),
}))

export const teamUserRelations = relations(teamUser, ({ one }) => ({
  team: one(teams, {
    fields: [teamUser.teamId],
    references: [teams.teamId],
  }),
  user: one(users, {
    fields: [teamUser.userId],
    references: [users.userId],
  }),
}))

export const userSitesRelations = relations(userSites, ({ one, many }) => ({
  user: one(users, {
    fields: [userSites.userId],
    references: [users.userId],
  }),
  site: one(sites, {
    fields: [userSites.siteId],
    references: [sites.siteId],
    relationName: 'sites_users',
  }),
  sites: many(sites),
}))

export const teamSitesRelations = relations(teamSites, ({ one }) => ({
  team: one(teams, {
    fields: [teamSites.teamId],
    references: [teams.teamId],
  }),
  site: one(sites, {
    fields: [teamSites.siteId],
    references: [sites.siteId],
  }),
}))
