import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import type { RequiredNonNullable } from '~~/layers/core/app/types/util'
import type { GoogleOAuthUser } from '~~/layers/core/server/app/utils/auth'
import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { customAlphabet } from 'nanoid'
// TODO(v1): google-auth-library not directly installed; using inline minimal types.
interface TokenInfo { scopes?: string[], expiry_date?: number }
interface CredentialRequest { refresh_token?: string, access_token?: string, expiry_date?: number, scope?: string, token_type?: string, id_token?: string }

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const length = 12

const nanoid = customAlphabet(alphabet, length)
const apiKeyAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const apiKey = customAlphabet(apiKeyAlphabet, 40)

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
  // pro-saas augment: explicit owner (nullable until backfilled to personal-team creator)
  ownerId: integer('owner_id').references((): AnySQLiteColumn => users.userId, { onDelete: 'cascade' }),
  // gscdump partner team mirror id
  gscdumpTeamId: text('gscdump_team_id'),
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

  currentTeamId: integer('current_team_id').references((): AnySQLiteColumn => teams.teamId),

  // gscdump partner integration
  gscdumpUserId: text('gscdump_user_id'),
  gscdumpApiKey: text('gscdump_api_key'),

  // Agent-native auth: per-user API key for MCP/CLI/webhook hosts.
  // Nullable for additive migration; backfilled via nanoid in 0004 then enforced.
  apiKey: text('api_key').unique(),

  // Stripe billing mirror (V1 tiers: pro|growth|scale; status includes 'trial').
  stripeCustomerId: text('stripe_customer_id'),
  stripeEmail: text('stripe_email'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status').$type<'trial' | 'active' | 'past_due' | 'paused' | 'canceled' | 'read_only' | 'archived'>(),
  subscriptionTier: text('subscription_tier').$type<'pro' | 'growth' | 'scale'>(),
  billingCycle: text('billing_cycle').$type<'monthly' | 'annual'>(),
  sitesLimit: integer('sites_limit'),
  promptsLimit: integer('prompts_limit'),
  trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  readOnlyUntil: integer('read_only_until', { mode: 'timestamp' }),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),

  // Sign-up source for funnel attribution
  source: text('source'),
  onboardingCompletedAt: integer('onboarding_completed_at', { mode: 'timestamp' }),

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
  sitemaps: text('sitemaps', { mode: 'json' }).$type<any[]>(),

  // for split domain properties
  domain: text('domain'),
  parentId: integer('parent_id').references((): AnySQLiteColumn => sites.siteId),

  // TODO better renaming for these two
  lastSynced: integer('last_synced'),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  ownerId: integer('owner_id').references((): AnySQLiteColumn => users.userId),

  // gscdump partner integration
  gscdumpSiteId: text('gscdump_site_id'),
  gscdumpSiteUrl: text('gscdump_site_url'),
  gscdumpSyncStatus: text('gscdump_sync_status').$type<'pending' | 'syncing' | 'synced' | 'error'>(),

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
  inspectionPayload: text('inspection_payload', { mode: 'json' }).$type<any>(),
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

  // TODO make life easier for querying?
  // save all percentile 75
  mobileOriginCls75: integer('mobile_origin_cls_75'),
  mobileOriginTtfb75: integer('mobile_origin_ttfb_75'),
  mobileOriginFcp75: integer('mobile_origin_fcp_75'),
  mobileOriginLcp75: integer('mobile_origin_lcp_75'),
  mobileOriginInp75: integer('mobile_origin_inp_75'),
  // now desktop
  desktopOriginCls75: integer('desktop_origin_cls_75'),
  desktopOriginTtfb75: integer('desktop_origin_ttfb_75'),
  desktopOriginFcp75: integer('desktop_origin_fcp_75'),
  desktopOriginLcp75: integer('desktop_origin_lcp_75'),
  desktopOriginInp75: integer('desktop_origin_inp_75'),

  keywords: integer('keywords'),
  pages: integer('pages'),

  mobileClicks: integer('mobile_clicks'),
  mobileImpressions: integer('mobile_impressions'),
  mobileCtr: integer('mobile_ctr'),
  mobilePosition: integer('mobile_position'),

  desktopClicks: integer('desktop_clicks'),
  desktopImpressions: integer('desktop_impressions'),
  desktopCtr: integer('desktop_ctr'),
  desktopPosition: integer('desktop_position'),

  tabletClicks: integer('tablet_clicks'),
  tabletImpressions: integer('tablet_impressions'),
  tabletCtr: integer('tablet_ctr'),
  tabletPosition: integer('tablet_position'),

  // web indexing
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
  indexedPagesCount: integer('indexed_pages_count').default(0),
  totalPagesCount: integer('total_pages_count').default(0),
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date),
}))

export type SiteDateAnalyticsSelect = typeof siteDateAnalytics.$inferSelect

export const siteDateCountryAnalytics = sqliteTable('site_date_country_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path
  country: text('country').notNull(),
  ...googleSearchConsolePageAnalytics,
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.country),
}))

export const sitePathDateAnalytics = sqliteTable('site_path_date_analytics', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(), // all data for a path
  path: text('path').notNull(),
  ...googleSearchConsolePageAnalytics,
  // keywords: integer('keywords'),

  // TODO make life easier for querying?
  // save all percentile 75
  // now desktop

  // google search console (query by date and path)
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.path),
}))

export type SiteUrlDateAnalyticsSelect = typeof sitePathDateAnalytics.$inferSelect

export const keywords = sqliteTable('keywords', {
  keywordId: integer('keyword_id').notNull().primaryKey(),
  keyword: text('keyword').notNull().unique(),

  // googleAdsPayload: text('google_ads_data', { mode: 'json' }).$type<GenerateKeywordIdeaResponse>(),
  competitionIndex: integer('competition_index'),
  competition: text('competition'),
  monthlySearchVolumes: text('monthly_search_volumes', { mode: 'json' }).$type<{ date: string, value: number }[]>(),
  avgMonthlySearches: integer('avg_monthly_searches'),
  currentMonthSearchVolume: integer('current_month_search_volume'),
  averageCpcMicros: integer('average_cpc_micros'),
  lastSynced: integer('last_synced'),

  ...timestamps,
})

export const relatedKeywords = sqliteTable('related_keywords', {
  // composite key for keywords.keywordId and keywords.keywordId
  keywordId: integer('keyword_id').notNull().references(() => keywords.keywordId),
  relatedKeywordId: integer('related_keyword_id').notNull().references(() => keywords.keywordId),
  siteId: integer('site_id').notNull().references(() => sites.siteId),
}, t => ({
  unq: unique().on(t.keywordId, t.relatedKeywordId, t.siteId),
}))

// TODO siteUsages (need to figure out billing but more granular is better)
export const usages = sqliteTable('usages', {
  siteId: integer('site_id').notNull().references(() => sites.siteId),
  date: text('date').notNull(),
  key: text('key').notNull(),
  usage: integer('usage').notNull().default(0),
}, (t) => {
  return {
    unq: unique().on(t.siteId, t.date, t.key),
  }
})

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
  country: text('country').notNull(),
  device: text('device').notNull(),
  ...googleSearchConsolePageAnalytics,
  ...timestamps,
}, t => ({
  unq: unique().on(t.siteId, t.date, t.keyword, t.path, t.country, t.device),
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
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  parentBatchId: text('parent_batch_id'),
  totalJobs: integer('total_jobs').notNull().default(0),
  pendingJobs: integer('pending_jobs').notNull().default(0),
  failedJobs: integer('failed_jobs').notNull().default(0),
  onFinish: text('on_finish'), // JSON: { name, payload }
  allowFailures: integer('allow_failures').default(0),
  siteId: integer('site_id'),
  userId: integer('user_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  finishedAt: integer('finished_at'),
})

export type JobBatchInsert = typeof jobBatches.$inferInsert
export type JobBatchSelect = typeof jobBatches.$inferSelect

export const jobs = sqliteTable('jobs', {
  id: text('id').notNull().primaryKey(),
  queue: text('queue').notNull(),
  jobType: text('job_type').notNull(),
  batchId: text('batch_id'),
  userId: integer('user_id'),
  siteId: integer('site_id'),
  payload: text('payload').notNull(), // JSON string with _task embedded
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  reservedAt: integer('reserved_at'),
  availableAt: integer('available_at').notNull(),
  createdAt: integer('created_at').notNull(),
  completedAt: integer('completed_at'),
  failedAt: integer('failed_at'),
  lastError: text('last_error'),
  durationMs: integer('duration_ms'),
}, t => ({
  queueIdx: index('queue_idx').on(t.queue),
  batchIdx: index('batch_idx').on(t.batchId),
}))

export type JobInsert = typeof jobs.$inferInsert
export type JobSelect = typeof jobs.$inferSelect

export const failedJobs = sqliteTable('failed_jobs', {
  id: text('id').notNull().primaryKey(),
  queue: text('queue').notNull(),
  jobType: text('job_type').notNull(),
  batchId: text('batch_id'),
  userId: integer('user_id'),
  siteId: integer('site_id'),
  payload: text('payload').notNull(),
  exception: text('exception').notNull(),
  attempts: integer('attempts').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  failedAt: integer('failed_at').notNull(),
})

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

// ─────────────────────────────────────────────────────────────────────────────
// Pro-SaaS layer tables (adapted from layers/pro-saas; integer FKs to users/teams)
// ─────────────────────────────────────────────────────────────────────────────

export type AuthProviderId = 'github' | 'google'

// Sign-in identities. One row per (user, provider).
export const userIdentities = sqliteTable('user_identities', {
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  provider: text('provider').$type<AuthProviderId>().notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  linkedAt: integer('linked_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  pk: unique('user_identities_pk').on(t.provider, t.providerUserId),
  userProviderUnq: unique('user_identities_user_provider_unique').on(t.userId, t.provider),
  emailIdx: index('user_identities_email_idx').on(t.email),
  userIdx: index('user_identities_user_idx').on(t.userId),
}))

export type UserIdentity = typeof userIdentities.$inferSelect
export type NewUserIdentity = typeof userIdentities.$inferInsert

export type TeamRole = 'admin' | 'editor' | 'viewer'

// Non-owner team members. Owner has no row here (FK on teams.ownerId).
export const teamMemberships = sqliteTable('team_memberships', {
  teamMembershipId: integer('team_membership_id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  firstVisitDismissedAt: integer('first_visit_dismissed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  teamUserUnq: unique('team_memberships_team_user_unique').on(t.teamId, t.userId),
}))

export const teamInvitations = sqliteTable('team_invitations', {
  teamInvitationId: integer('team_invitation_id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  invitedById: integer('invited_by_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  teamEmailUnq: unique('team_invitations_team_email_unique').on(t.teamId, t.email),
}))

export type TeamAuditEventKind
  = | 'team.renamed'
    | 'team.transferred'
    | 'invitation.sent'
    | 'invitation.revoked'
    | 'invitation.accepted'
    | 'member.role_changed'
    | 'member.removed'
    | 'member.left'
    | 'api_token.created'
    | 'api_token.rerolled'
    | 'api_token.revoked'

export const teamAuditEvents = sqliteTable('team_audit_events', {
  teamAuditEventId: integer('team_audit_event_id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  actorUserId: integer('actor_user_id').references(() => users.userId, { onDelete: 'set null' }),
  kind: text('kind').$type<TeamAuditEventKind>().notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  teamCreatedIdx: index('team_audit_events_team_created_idx').on(t.teamId, t.createdAt),
}))

// Team-scoped API tokens (Sanctum-style). Hashed at rest.
export const teamApiTokens = sqliteTable('team_api_tokens', {
  teamApiTokenId: integer('team_api_token_id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  last4: text('last4').notNull(),
  label: text('label'),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  tokenHashUnq: unique('team_api_tokens_token_hash_unique').on(t.tokenHash),
  teamIdx: index('team_api_tokens_team_idx').on(t.teamId),
}))

export type TeamGscCredentialStatus = 'active' | 'revoked' | 'failed'

// Pooled team GSC credentials. Distinct from core `googleAccounts` —
// `googleAccounts` carries per-user OAuth (used by site sync); this table is
// the team-pool view used by gscdump partner API. Decision deferred to Agent C.
export const teamGscCredentials = sqliteTable('team_gsc_credentials', {
  teamGscCredentialId: integer('team_gsc_credential_id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  gscdumpUserId: text('gscdump_user_id').notNull(),
  gscdumpApiKey: text('gscdump_api_key').notNull(),
  label: text('label'),
  status: text('status', { enum: ['active', 'revoked', 'failed'] }).$type<TeamGscCredentialStatus>().notNull().default('active'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  teamUserUnq: unique('team_gsc_credentials_team_user_unique').on(t.teamId, t.userId),
}))

// Site groups for portfolio-operator dashboard organization.
export const siteGroups = sqliteTable('site_groups', {
  siteGroupId: integer('site_group_id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  teamId: integer('team_id').references(() => teams.teamId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ─── Billing / Stripe ────────────────────────────────────────────────────────

export const stripeWebhookEvents = sqliteTable('stripe_webhook_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
})

export const billingEvents = sqliteTable('billing_events', {
  billingEventId: integer('billing_event_id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  teamId: integer('team_id').references(() => teams.teamId, { onDelete: 'set null' }),
  kind: text('kind', { enum: ['payment_failed', 'refunded', 'disputed'] }).notNull(),
  stripeId: text('stripe_id').notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason'),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
}, t => ({
  kindStripeUnq: unique('billing_events_kind_stripe_id_unique').on(t.kind, t.stripeId),
  userKindIdx: index('billing_events_user_kind_idx').on(t.userId, t.kind),
  teamCreatedIdx: index('billing_events_team_created_idx').on(t.teamId, t.createdAt),
}))

// ─── Usage / Events / Errors ─────────────────────────────────────────────────

export type ApiUsageSource = 'mcp' | 'rest' | 'internal'
export type ApiUsageStatus = 'success' | 'error'

export const apiUsageEvents = sqliteTable('pro_api_usage_events', {
  apiUsageEventId: integer('api_usage_event_id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.teamId, { onDelete: 'cascade' }),
  teamApiTokenId: integer('team_api_token_id').references(() => teamApiTokens.teamApiTokenId, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
  source: text('source', { enum: ['mcp', 'rest', 'internal'] }).$type<ApiUsageSource>().notNull(),
  method: text('method'),
  path: text('path'),
  action: text('action'),
  target: text('target'),
  status: text('status', { enum: ['success', 'error'] }).$type<ApiUsageStatus>().notNull().default('success'),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'),
  client: text('client'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  errorCode: text('error_code'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  teamCreatedIdx: index('pro_api_usage_events_team_created_idx').on(t.teamId, t.createdAt),
  tokenCreatedIdx: index('pro_api_usage_events_token_created_idx').on(t.teamApiTokenId, t.createdAt),
  teamSourceCreatedIdx: index('pro_api_usage_events_team_source_created_idx').on(t.teamId, t.source, t.createdAt),
}))

export const mcpUsage = sqliteTable('pro_mcp_usage', {
  mcpUsageId: integer('mcp_usage_id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
  teamId: integer('team_id').references(() => teams.teamId, { onDelete: 'cascade' }),
  teamApiTokenId: integer('team_api_token_id').references(() => teamApiTokens.teamApiTokenId, { onDelete: 'set null' }),
  sessionId: text('session_id').notNull(),
  endpoint: text('endpoint', { enum: ['mcp', 'mcp/pro'] }).notNull(),
  action: text('action', { enum: ['connect', 'tool_call', 'prompt_call', 'resource_read', 'disconnect'] }).notNull(),
  target: text('target'),
  client: text('client'),
  status: text('status', { enum: ['success', 'error'] }).notNull().default('success'),
  responseTime: integer('response_time'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  tokenIdx: index('pro_mcp_usage_team_api_token_idx').on(t.teamApiTokenId),
}))

export const proEvents = sqliteTable('pro_events', {
  proEventId: integer('pro_event_id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at').notNull(),
}, t => ({
  userTypeIdx: index('pro_events_user_type_idx').on(t.userId, t.type),
}))

export const adminEvents = sqliteTable('admin_events', {
  adminEventId: integer('admin_event_id').primaryKey({ autoIncrement: true }),
  actorUserId: integer('actor_user_id').references(() => users.userId, { onDelete: 'set null' }),
  kind: text('kind').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
}, t => ({
  kindCreatedIdx: index('admin_events_kind_created_idx').on(t.kind, t.createdAt),
}))

export const runtimeErrors = sqliteTable('runtime_errors', {
  runtimeErrorId: integer('runtime_error_id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at').notNull(),
  level: text('level').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  error: text('error'),
  ctx: text('ctx'),
  requestId: text('request_id'),
  userId: integer('user_id'),
  path: text('path'),
}, t => ({
  nameCreatedIdx: index('runtime_errors_name_created_idx').on(t.name, t.createdAt),
  userCreatedIdx: index('runtime_errors_user_created_idx').on(t.userId, t.createdAt),
  levelCreatedIdx: index('runtime_errors_level_created_idx').on(t.level, t.createdAt),
}))

// Anonymous (CI builds) + pro (licensed) telemetry.
export const telemetryEvents = sqliteTable('telemetry_events', {
  telemetryEventId: integer('telemetry_event_id').primaryKey({ autoIncrement: true }),
  source: text('source', { enum: ['anonymous', 'pro'] }).notNull(),
  projectHash: text('project_hash'),
  siteUrl: text('site_url'),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
  modules: text('modules', { mode: 'json' }).$type<string[]>().notNull(),
  moduleVersions: text('module_versions', { mode: 'json' }).$type<Record<string, string>>(),
  config: text('config', { mode: 'json' }).$type<Record<string, Record<string, boolean | string | number>>>(),
  nuxtVersion: text('nuxt_version'),
  nodeVersion: text('node_version'),
  packageManager: text('package_manager'),
  os: text('os'),
  ci: text('ci'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const notifications = sqliteTable('notifications', {
  notificationId: integer('notification_id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().$defaultFn(nanoid),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  title: text('title'),
  body: text('body'),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
}))

export const feedback = sqliteTable('feedback', {
  feedbackId: integer('feedback_id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  thumb: text('thumb', { enum: ['up', 'down'] }),
  comment: text('comment'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ─────────────────────────────────────────────────────────────────────────────
// V1 net-new tables (per V1.md line 99–120)
// ─────────────────────────────────────────────────────────────────────────────

// AI crawler hits from the edge worker. Hot 30 days in D1; archived to R2 Parquet.
export const crawlerHits = sqliteTable('crawler_hits', {
  crawlerHitId: integer('crawler_hit_id').primaryKey({ autoIncrement: true }),
  siteId: integer('site_id').notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  ts: integer('ts').notNull(), // unix ms
  // Resolved engine: 'gpt' | 'claude' | 'perplexity' | 'google-extended' | 'oai-search' | 'apple-extended' | 'cc' | 'bytespider' | 'amazon' | 'other'
  engine: text('engine').notNull(),
  ua: text('ua').notNull(),
  uaHash: text('ua_hash').notNull(),
  path: text('path').notNull(),
  status: integer('status'),
  country: text('country'),
}, t => ({
  siteTsIdx: index('crawler_hits_site_ts_idx').on(t.siteId, t.ts),
  siteEngineTsIdx: index('crawler_hits_site_engine_ts_idx').on(t.siteId, t.engine, t.ts),
}))

// Cloudflare Queue mirror of submitted URLs. Distinct from generic `jobs`.
export const indexingJobs = sqliteTable('indexing_jobs', {
  indexingJobId: integer('indexing_job_id').primaryKey({ autoIncrement: true }),
  siteId: integer('site_id').notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  transport: text('transport').notNull(), // 'google' | 'bing' | 'yandex' | 'naver' | 'seznam'
  state: text('state').notNull().default('queued'), // 'queued' | 'submitted' | 'accepted' | 'rejected' | 'error'
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  siteStateIdx: index('indexing_jobs_site_state_idx').on(t.siteId, t.state),
  sitePathTransportUnq: unique('indexing_jobs_site_path_transport_unique').on(t.siteId, t.path, t.transport),
}))

// User-tracked investigation status for an indexing issue on a URL. Purely a
// status/note tracker, not a live inspection: recorded when a user marks an
// issue as investigated/fixed/false-positive/etc. Live inspection goes through
// gscdump's `inspect.create` operation separately, not this table.
export const indexingInvestigations = sqliteTable('indexing_investigations', {
  indexingInvestigationId: integer('indexing_investigation_id').primaryKey({ autoIncrement: true }),
  siteId: integer('site_id').notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  issueType: text('issue_type').notNull(),
  status: text('status').notNull().default('investigated'), // 'investigated' | 'monitoring' | 'false_positive' | 'wont_fix' | 'fixed'
  note: text('note'),
  investigatedAt: integer('investigated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  siteUrlIssueUnq: unique('indexing_investigations_site_url_issue_unique').on(t.siteId, t.url, t.issueType),
  siteIdx: index('indexing_investigations_site_idx').on(t.siteId),
}))

// One row per (site, prompt, llm, day). Citation tracker output.
export const citationRuns = sqliteTable('citation_runs', {
  citationRunId: integer('citation_run_id').primaryKey({ autoIncrement: true }),
  siteId: integer('site_id').notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  promptId: text('prompt_id').notNull(),
  model: text('model').notNull(), // 'claude-opus' | 'gpt-4' | 'perplexity' | 'gemini' | 'grok'
  ts: integer('ts').notNull(), // unix ms day-bucket
  cited: integer('cited', { mode: 'boolean' }).notNull(),
  position: integer('position'),
  snippet: text('snippet'),
  sources: text('sources', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  sitePromptTsIdx: index('citation_runs_site_prompt_ts_idx').on(t.siteId, t.promptId, t.ts),
  sitePromptModelDayUnq: unique('citation_runs_site_prompt_model_day_unique').on(t.siteId, t.promptId, t.model, t.ts),
}))

// Diffable history of llms.txt for a site.
export const llmsTxtVersions = sqliteTable('llmstxt_versions', {
  llmsTxtVersionId: integer('llmstxt_version_id').primaryKey({ autoIncrement: true }),
  siteId: integer('site_id').notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  ts: integer('ts').notNull(),
  contentHash: text('content_hash').notNull(),
  content: text('content').notNull(),
  generatedFrom: text('generated_from').notNull(), // 'auto' | 'manual'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => ({
  siteTsIdx: index('llmstxt_versions_site_ts_idx').on(t.siteId, t.ts),
  siteHashUnq: unique('llmstxt_versions_site_hash_unique').on(t.siteId, t.contentHash),
}))

// ─── Relations (pro-saas + V1) ───────────────────────────────────────────────

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, { fields: [userIdentities.userId], references: [users.userId] }),
}))

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  team: one(teams, { fields: [teamMemberships.teamId], references: [teams.teamId] }),
  user: one(users, { fields: [teamMemberships.userId], references: [users.userId] }),
}))

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, { fields: [teamInvitations.teamId], references: [teams.teamId] }),
  invitedBy: one(users, { fields: [teamInvitations.invitedById], references: [users.userId] }),
}))

export const teamAuditEventsRelations = relations(teamAuditEvents, ({ one }) => ({
  team: one(teams, { fields: [teamAuditEvents.teamId], references: [teams.teamId] }),
  actor: one(users, { fields: [teamAuditEvents.actorUserId], references: [users.userId] }),
}))

export const teamApiTokensRelations = relations(teamApiTokens, ({ one }) => ({
  team: one(teams, { fields: [teamApiTokens.teamId], references: [teams.teamId] }),
  user: one(users, { fields: [teamApiTokens.userId], references: [users.userId] }),
}))

export const teamGscCredentialsRelations = relations(teamGscCredentials, ({ one }) => ({
  team: one(teams, { fields: [teamGscCredentials.teamId], references: [teams.teamId] }),
  user: one(users, { fields: [teamGscCredentials.userId], references: [users.userId] }),
}))

export const siteGroupsRelations = relations(siteGroups, ({ one }) => ({
  team: one(teams, { fields: [siteGroups.teamId], references: [teams.teamId] }),
}))

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  user: one(users, { fields: [billingEvents.userId], references: [users.userId] }),
  team: one(teams, { fields: [billingEvents.teamId], references: [teams.teamId] }),
}))

export const apiUsageEventsRelations = relations(apiUsageEvents, ({ one }) => ({
  team: one(teams, { fields: [apiUsageEvents.teamId], references: [teams.teamId] }),
  teamApiToken: one(teamApiTokens, { fields: [apiUsageEvents.teamApiTokenId], references: [teamApiTokens.teamApiTokenId] }),
  user: one(users, { fields: [apiUsageEvents.userId], references: [users.userId] }),
}))

export const mcpUsageRelations = relations(mcpUsage, ({ one }) => ({
  user: one(users, { fields: [mcpUsage.userId], references: [users.userId] }),
  team: one(teams, { fields: [mcpUsage.teamId], references: [teams.teamId] }),
  teamApiToken: one(teamApiTokens, { fields: [mcpUsage.teamApiTokenId], references: [teamApiTokens.teamApiTokenId] }),
}))

export const proEventsRelations = relations(proEvents, ({ one }) => ({
  user: one(users, { fields: [proEvents.userId], references: [users.userId] }),
}))

export const adminEventsRelations = relations(adminEvents, ({ one }) => ({
  actor: one(users, { fields: [adminEvents.actorUserId], references: [users.userId] }),
}))

export const telemetryEventsRelations = relations(telemetryEvents, ({ one }) => ({
  user: one(users, { fields: [telemetryEvents.userId], references: [users.userId] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.userId] }),
}))

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.userId] }),
}))

export const crawlerHitsRelations = relations(crawlerHits, ({ one }) => ({
  site: one(sites, { fields: [crawlerHits.siteId], references: [sites.siteId] }),
}))

export const indexingJobsRelations = relations(indexingJobs, ({ one }) => ({
  site: one(sites, { fields: [indexingJobs.siteId], references: [sites.siteId] }),
}))

export const indexingInvestigationsRelations = relations(indexingInvestigations, ({ one }) => ({
  site: one(sites, { fields: [indexingInvestigations.siteId], references: [sites.siteId] }),
}))

export const citationRunsRelations = relations(citationRuns, ({ one }) => ({
  site: one(sites, { fields: [citationRuns.siteId], references: [sites.siteId] }),
}))

export const llmsTxtVersionsRelations = relations(llmsTxtVersions, ({ one }) => ({
  site: one(sites, { fields: [llmsTxtVersions.siteId], references: [sites.siteId] }),
}))

// ─── Type exports ────────────────────────────────────────────────────────────

export type TeamMembership = typeof teamMemberships.$inferSelect
export type TeamInvitation = typeof teamInvitations.$inferSelect
export type TeamAuditEvent = typeof teamAuditEvents.$inferSelect
export type NewTeamAuditEvent = typeof teamAuditEvents.$inferInsert
export type TeamApiToken = typeof teamApiTokens.$inferSelect
export type NewTeamApiToken = typeof teamApiTokens.$inferInsert
export type TeamGscCredential = typeof teamGscCredentials.$inferSelect
export type NewTeamGscCredential = typeof teamGscCredentials.$inferInsert
export type SiteGroup = typeof siteGroups.$inferSelect
export type NewSiteGroup = typeof siteGroups.$inferInsert
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert
export type BillingEvent = typeof billingEvents.$inferSelect
export type NewBillingEvent = typeof billingEvents.$inferInsert
export type ApiUsageEvent = typeof apiUsageEvents.$inferSelect
export type NewApiUsageEvent = typeof apiUsageEvents.$inferInsert
export type McpUsage = typeof mcpUsage.$inferSelect
export type NewMcpUsage = typeof mcpUsage.$inferInsert
export type ProEvent = typeof proEvents.$inferSelect
export type NewProEvent = typeof proEvents.$inferInsert
export type AdminEvent = typeof adminEvents.$inferSelect
export type NewAdminEvent = typeof adminEvents.$inferInsert
export type RuntimeError = typeof runtimeErrors.$inferSelect
export type NewRuntimeError = typeof runtimeErrors.$inferInsert
export type TelemetryEvent = typeof telemetryEvents.$inferSelect
export type NewTelemetryEvent = typeof telemetryEvents.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
export type CrawlerHit = typeof crawlerHits.$inferSelect
export type NewCrawlerHit = typeof crawlerHits.$inferInsert
export type IndexingJob = typeof indexingJobs.$inferSelect
export type NewIndexingJob = typeof indexingJobs.$inferInsert
export type IndexingInvestigation = typeof indexingInvestigations.$inferSelect
export type NewIndexingInvestigation = typeof indexingInvestigations.$inferInsert
export type CitationRun = typeof citationRuns.$inferSelect
export type NewCitationRun = typeof citationRuns.$inferInsert
export type LlmsTxtVersion = typeof llmsTxtVersions.$inferSelect
export type NewLlmsTxtVersion = typeof llmsTxtVersions.$inferInsert
export type NewUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

// Pro-saas compatibility aliases (text id semantics → integer userId/teamId surfaces)
export type Site = SiteSelect
export type Team = TeamSelect
