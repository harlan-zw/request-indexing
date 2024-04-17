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
  property: text('property').notNull(), // must have a gsc property linked to it
  isDomainProperty: integer('is_domain_property', { mode: 'boolean' }).notNull().default(false),
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

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export type SiteSelect = typeof sites.$inferSelect

export const siteUrls = sqliteTable('site_urls', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  path: text('path').notNull(),
  lastInspected: integer('last_inspected'),
  status: text('status'),
  payload: text('payload', { mode: 'json' }),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  pathIdx: index('path_site_url_idx').on(t.path),
  unq: unique().on(t.siteId, t.path),
}))

export const siteUrlAnalytics = sqliteTable('site_url_analytics', {
  siteUrlAnalyticId: integer('site_url_analytic_id').notNull().primaryKey(),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  page: text('page'), // all data for a day
  date: text('date'), // all data for a path
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  ctr: integer('ctr').default(0),
  position: integer('position').default(0),

  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  pageIdx: index('path_idx_analytics').on(t.page),
  dateIdx: index('date_idx_analytics').on(t.date),
}))

export const userTeamSites = sqliteTable('user_team_sites', {
  teamId: integer('team_id').notNull().references(() => teams.teamId),
  userId: integer('user_id').notNull().references(() => users.userId),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  origin: text('origin'),
  permissionLevel: text('permission_level'),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
}, t => ({
  unq: unique().on(t.teamId, t.userId, t.siteId),
}))

// multiple users and access a single site
export const teamSites = sqliteTable('team_sites', {
  teamId: integer('team_id').notNull().references(() => teams.teamId),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
}, t => ({
  unq: unique().on(t.teamId, t.siteId),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.userId],
  }),
}))

export const sitesRelations = relations(sites, ({ many }) => ({
  teams: many(teams),
  urlAnalytics: many(siteUrlAnalytics),
  userTeamSites: many(userTeamSites, { relationName: 'sites_users' }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.currentTeamId],
    references: [teams.teamId],
  }),
  sessions: many(sessions),
  userTeamSites: many(userTeamSites),
}))

export const userTeamSitesRelations = relations(userTeamSites, ({ one, many }) => ({
  user: one(users, {
    fields: [userTeamSites.userId],
    references: [users.userId],
  }),
  site: one(sites, {
    fields: [userTeamSites.siteId],
    references: [sites.siteId],
    relationName: 'sites_users',
  }),
  sites: many(sites),
  team: one(teams, {
    fields: [userTeamSites.teamId],
    references: [teams.teamId],
  }),
  teamSite: one(teamSites, {
    fields: [userTeamSites.teamId, userTeamSites.siteId],
    references: [teamSites.teamId, teamSites.siteId],
  }),
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
