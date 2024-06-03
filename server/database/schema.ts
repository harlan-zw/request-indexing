import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { customAlphabet } from 'nanoid'
import { relations, sql } from 'drizzle-orm'
import type { TokenInfo } from 'google-auth-library'
import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import type { CredentialRequest } from 'google-auth-library/build/src/auth/credentials'
import type { BlobObject } from '@nuxthub/core/dist/runtime/server/utils/blob'
import type { RequiredNonNullable } from '~/types/util'
import type { GoogleOAuthUser } from '~/server/app/utils/auth'
import type { TaskMap } from '~/server/plugins/eventServiceProvider'

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const length = 12

const nanoid = customAlphabet(alphabet, length)

const timestamps = {
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}

const googleSearchConsolePageAnalytics = {
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  ctr: integer('ctr').default(0),
  position: integer('position').default(0),
}

export const teams = sqliteTable('teams', {
  teamId: integer('team_id').notNull().primaryKey(),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  personalTeam: integer('personal_team', { mode: 'boolean' }).notNull().default(true),
  name: text('name').notNull(),
  backupsEnabled: integer('backups_enabled').notNull().default(0),
  onboardedStep: text('onboarded_step'),
  ...timestamps,
})

export const users = sqliteTable('users', {
  userId: integer('user_id').notNull().primaryKey(),
  publicId: text('public_id').notNull().$defaultFn(nanoid),

  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar').notNull(),

  // authPayload: text('auth_payload', { mode: 'json' }),
  lastLogin: integer('last_login').notNull(),
  sub: text('sub').notNull().unique(),
  // loginTokens: text('login_tokens', { mode: 'json' }).notNull().$type<Credentials>(),

  analyticsRange: text('analytics_range', { mode: 'json' }),
  analyticsPeriod: text('analytics_period'),

  // indexingTokens: text('indexing_tokens', { mode: 'json' }),
  // indexingOAuthId: text('indexing_oauth_id'),
  lastIndexingOAuthId: text('last_indexing_oauth_id'),

  currentTeamId: integer('current_team_id').notNull().references((): AnySQLiteColumn => teams.teamId),

  ...timestamps,
})

export const googleOAuthClients = sqliteTable('google_oauth_clients', {
  googleOAuthClientId: integer('google_oauth_client_id').notNull().primaryKey(),
  label: text('label').notNull(),
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret').notNull(),
  reserved: integer('reserved', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
}, t => ({
  unq: unique().on(t.clientId),
}))

export type GoogleOAuthClientsSelect = typeof googleOAuthClients.$inferSelect

// a user can have multiple google accounts linked to themselves
// we use a seperate oauth for indexing so a user could have 2 here so we need a type column
export const googleAccounts = sqliteTable('google_accounts', {
  googleAccountId: integer('google_account_id').notNull().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.userId),
  type: text('type').notNull(), // auth, indexing
  payload: text('payload', { mode: 'json' }).notNull().$type<GoogleOAuthUser>(),
  tokenInfo: text('token_info', { mode: 'json' }).$type<TokenInfo>(),
  tokens: text('tokens', { mode: 'json' }).notNull().$type<RequiredNonNullable<CredentialRequest>>(),
  googleOAuthClientId: integer('google_oauth_client_id').notNull().references(() => googleOAuthClients.googleOAuthClientId),
  ...timestamps,
})

export type GoogleAccountsSelect = typeof googleAccounts.$inferSelect

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

  ...timestamps,
}, t => ({
  unq: unique().on(t.teamId, t.userId),
}))

export const teamUserInvite = sqliteTable('team_user_invite', {
  // invite is token based not email
  inviteId: text('invite_id').notNull().primaryKey(),
  teamId: integer('team_id').notNull(),
  email: text('email').notNull(),
  role: text('role'),
  ...timestamps,
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

  // TODO better renaming for these two
  lastSynced: integer('last_synced'),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  ownerId: integer('owner_id').references((): AnySQLiteColumn => users.userId),
  ...timestamps,
}, t => ({
  unqDomain: unique().on(t.domain),
  unqPublicId: unique().on(t.publicId),
}))

export type SiteInsert = typeof sites.$inferInsert
export type SiteSelect = typeof sites.$inferSelect

export const sitePaths = sqliteTable('site_paths', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  path: text('path').notNull(),
  firstSeenIndexed: integer('first_seen_indexed'),
  isIndexed: integer('is_indexed', { mode: 'boolean' }).notNull().default(false),
  indexingVerdict: text('indexing_verdict'),
  inspectionPayload: text('inspection_payload', { mode: 'json' }).$type<searchconsole_v1.Schema$UrlInspectionResult>(),
  lastInspected: integer('last_inspected'),
  ...timestamps,
}, t => ({
  pathIdx: index('path_site_url_idx').on(t.path),
  unq: unique().on(t.siteId, t.path),
}))

export type SitePathSelect = typeof sitePaths.$inferSelect

export const siteDateAnalytics = sqliteTable('site_date_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path

  // google search console (query by date)
  ...googleSearchConsolePageAnalytics,

  keywords: integer('keywords'),
  pages: integer('pages'),

  // web indexing
  indexedPagesCount: integer('indexed_pages_count').default(0),
  totalPagesCount: integer('total_pages_count').default(0),

  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date),
}))

export type SiteDateAnalyticsSelect = typeof siteDateAnalytics.$inferSelect

export const sitePageSpeedInsightScans = sqliteTable('site_pagespeed_insight_scans', {
  sitePageSpeedInsightScanId: integer('site_pagespeed_insight_scan_id').notNull().primaryKey(),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  path: text('path').notNull(),
  strategy: text('strategy').notNull(),
  performance: integer('performance'),
  seo: integer('seo'),
  accessibility: integer('accessibility'),
  bestPractices: integer('best_practices'),
  reportBlob: text('report_path', { mode: 'json' }).$type<BlobObject>(),
  reportScreenshotBlob: text('report_screenshot_path', { mode: 'json' }).$type<BlobObject>(),
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => ({
  pathIdx: index('path_idx').on(t.path),
  strategyIdx: index('strategy_idx').on(t.strategy),
}))

export type SitePageSpeedInsightScansSelect = typeof sitePageSpeedInsightScans.$inferSelect

export const sitePathDateAnalytics = sqliteTable('site_path_date_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path
  path: text('path').notNull(),

  psiDesktopPerformance: integer('psi_desktop_performance'),
  psiMobilePerformance: integer('psi_mobile_performance'),
  psiDesktopSeo: integer('psi_desktop_seo'),
  psiMobileSeo: integer('psi_mobile_seo'),
  psiDesktopAccessibility: integer('psi_desktop_accessibility'),
  psiMobileAccessibility: integer('psi_mobile_accessibility'),
  psiDesktopBestPractices: integer('psi_desktop_best_practices'),
  psiMobileBestPractices: integer('psi_mobile_best_practices'),
  psiDesktopScore: integer('psi_desktop_score'),
  psiMobileScore: integer('psi_mobile_score'),

  psiDesktopLcp: integer('psi_desktop_lcp'),
  psiMobileLcp: integer('psi_mobile_lcp'),
  psiDesktopFcp: integer('psi_desktop_fcp'),
  psiMobileFcp: integer('psi_mobile_fcp'),
  psiDesktopSi: integer('psi_desktop_si'),
  psiMobileSi: integer('psi_mobile_si'),
  psiDesktopTbt: integer('psi_desktop_tbt'),
  psiMobileTbt: integer('psi_mobile_tbt'),
  psiDesktopCls: integer('psi_desktop_cls'),
  psiMobileCls: integer('psi_mobile_cls'),

  // google search console (query by date and path)
  ...googleSearchConsolePageAnalytics,
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.path),
}))

export type SiteUrlDateAnalyticsSelect = typeof sitePathDateAnalytics.$inferSelect

export const siteKeywordDateAnalytics = sqliteTable('site_keyword_date_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path
  keyword: text('keyword').notNull(),
  ...googleSearchConsolePageAnalytics,
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.keyword),
}))

export const siteKeywordDatePathAnalytics = sqliteTable('site_keyword_date_path_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path
  keyword: text('keyword').notNull(),
  path: text('path').notNull(),
  ...googleSearchConsolePageAnalytics,
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.keyword, t.path),
}))

export type SiteKeywordDateAnalyticsSelect = typeof sitePathDateAnalytics.$inferSelect

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
  // someone on the team must have the permissions
  googleAccountId: integer('google_account_id').notNull().references(() => googleAccounts.googleAccountId),
  // site can be linked to a team but may not be enabled due to
  // free tier can only have 6 active, need to manually be enabled
  // active: integer('active', { mode: 'boolean' }).notNull().default(false),
}, t => ({
  unq: unique().on(t.teamId, t.siteId),
  googleAccountIdIdx: index('google_account_id_idx').on(t.googleAccountId),
}))

export type TeamSitesSelect = typeof teamSites.$inferSelect
export type TeamSitesInsert = typeof teamSites.$inferInsert

export const jobBatches = sqliteTable('job_batches', {
  jobBatchId: integer('job_batch_id').notNull().primaryKey(),
  name: text('name').notNull(),
  totalJobs: integer('total_jobs').notNull().default(0),
  pendingJobs: integer('pending_jobs').notNull().default(0),
  failedJobs: integer('failed_jobs').notNull().default(0),
  failedJobIds: text('failed_job_ids', { mode: 'json' }).$type<number[]>(),
  options: text('options', { mode: 'json' }).$type<{ onFinish: { name: string, payload: any } }>(),
  cancelledAt: integer('cancelled_at'),
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  finishedAt: integer('finished_at'),
})

export type JobBatchInsert = typeof jobBatches.$inferInsert
export type JobBatchSelect = typeof jobBatches.$inferSelect

export const jobs = sqliteTable('jobs', {
  jobId: integer('job_id').notNull().primaryKey(),
  queue: text('queue').notNull(),
  entityId: integer('entity_id'),
  entityType: text('entity_type'),
  jobBatchId: integer('job_batch_id').references(() => jobBatches.jobBatchId),
  name: text('name').notNull().$type<keyof TaskMap>(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, any>>().notNull(),
  response: text('response', { mode: 'json' }).$type<Record<string, any>>(),
  attempts: integer('attempts').notNull().default(0),
  availableAt: integer('available_at'),
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  timeTaken: integer('time_taken'),
  status: text('status').notNull().default('pending').$type<'pending' | 'failed' | 'completed'>(),
}, t => ({
  queueIdx: index('queue_idx').on(t.queue),
  statusIdx: index('status_idx').on(t.status),
}))

export type JobInsert = typeof jobs.$inferSelect
export type JobSelect = typeof jobs.$inferSelect

export const failedJobs = sqliteTable('failed_jobs', {
  failedJobId: integer('failed_job_id').notNull().primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.jobId),
  exception: text('exception', { mode: 'json' }).notNull(),
  failedAt: integer('failed_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const failedJobsRelations = relations(failedJobs, ({ one }) => ({
  job: one(jobs, {
    fields: [failedJobs.jobId],
    references: [jobs.jobId],
  }),
}))

export const jobsRelations = relations(jobs, ({ many }) => ({
  failedJobs: many(failedJobs),
}))

export const googleOAuthClientsRelations = relations(googleOAuthClients, ({ many }) => ({
  googleAccounts: many(googleAccounts),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.userId],
  }),
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  teams: many(teams),
  urlAnalytics: many(siteDateAnalytics),
  urls: many(sitePaths),
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

export const siteUrlsRelations = relations(sitePaths, ({ one }) => ({
  site: one(sites, {
    fields: [sitePaths.siteId],
    references: [sites.siteId],
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.currentTeamId],
    references: [teams.teamId],
  }),
  sessions: many(sessions),
  userSites: many(userSites),
  googleAccounts: many(googleAccounts),
}))

export const googleAccountsRelations = relations(googleAccounts, ({ one }) => ({
  user: one(users, {
    fields: [googleAccounts.userId],
    references: [users.userId],
  }),
  googleOAuthClient: one(googleOAuthClients, {
    fields: [googleAccounts.googleOAuthClientId],
    references: [googleOAuthClients.googleOAuthClientId],
  }),
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
  googleAccount: one(googleAccounts, {
    fields: [teamSites.googleAccountId],
    references: [googleAccounts.googleAccountId],
  }),
}))
