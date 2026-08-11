import { relations, sql } from 'drizzle-orm'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
// Notifications table is owned by `modules/notifications` (the `nuxt-notifications` module).
// Re-exported so this file remains the schema entry point for drizzle-kit and
// so local relations() declarations below can reference the table object.
import { notifications } from '../../../../modules/notifications/src/schema'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  apiKey: text('api_key').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeEmail: text('stripe_email'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status'), // 'trial' | 'active' | 'past_due' | 'paused' | 'canceled' | 'read_only' | 'archived' | 'lifetime'
  // Cached Stripe state. Read-only mirrors of Stripe Subscription/Price; written
  // only by `syncUserFromStripe`. Tier + sitesLimit derive from price metadata.
  subscriptionTier: text('subscription_tier'), // 'pro' | 'agency'
  billingCycle: text('billing_cycle'), // 'monthly' | 'annual'
  sitesLimit: integer('sites_limit'),
  trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  // Our concepts (no Stripe equivalent).
  lifetimeGranted: integer('lifetime_granted', { mode: 'boolean' }).default(false),
  readOnlyUntil: integer('read_only_until', { mode: 'timestamp' }),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  discordId: text('discord_id'),
  discordUsername: text('discord_username'),
  discordAvatar: text('discord_avatar'),
  discordRoleAssigned: integer('discord_role_assigned', { mode: 'boolean' }),
  githubOrgInvited: integer('github_org_invited', { mode: 'boolean' }),
  // Google Search Console OAuth
  gscUserId: text('gsc_user_id'), // Google sub used by gscdump partner API
  gscEmail: text('gsc_email'), // Display value on GSC settings UI
  googleRefreshToken: text('google_refresh_token'),
  googleAccessToken: text('google_access_token'),
  googleTokenExpiry: integer('google_token_expiry', { mode: 'timestamp' }),
  googleScopes: text('google_scopes'), // space-separated OAuth scopes granted (e.g., 'email webmasters.readonly')
  gscConnected: integer('gsc_connected', { mode: 'boolean' }),
  // gscdump.com integration
  gscdumpUserId: text('gscdump_user_id'), // User ID returned from gscdump partner API
  gscdumpApiKey: text('gscdump_api_key'), // User's personal API key for direct frontend queries
  source: text('source'), // where user signed up from: 'pro-page', 'docs', 'tools', etc.
  // Monthly report channels (opt-in)
  monthlyReportEmail: integer('monthly_report_email', { mode: 'boolean' }),
  monthlyReportDiscord: integer('monthly_report_discord', { mode: 'boolean' }),
  // Deprecated: kept for backwards compatibility, not read
  monthlyReportDisabled: integer('monthly_report_disabled', { mode: 'boolean' }),
  lastMonthlyReportAt: integer('last_monthly_report_at', { mode: 'timestamp' }),
  monthlyReportFailedAt: integer('monthly_report_failed_at', { mode: 'timestamp' }),
  monthlyReportFailureReason: text('monthly_report_failure_reason'), // 'dm_closed' | 'not_in_guild' | 'api_error' | 'email_failed' | 'no_email'
  // Bulk-sender opt-out. Set by /api/unsubscribe one-click and by Resend cascade
  // (server/utils/resend-audiences.ts:applyResendUnsubscribes). sendEmail short-
  // circuits when true. Idempotent — a re-click is a no-op.
  emailUnsubscribed: integer('email_unsubscribed', { mode: 'boolean' }).default(false),
  // Scope of the monthly report: 'all' (default), 'group:<id>', or 'site:<id>'
  reportScope: text('report_scope').default('all'),
  onboardingCompletedAt: integer('onboarding_completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // Teams: current selected team. Backfilled to user's personal team during migration.
  // Lazy ref via callback because `teams` is declared below this table.
  currentTeamId: text('current_team_id').references((): AnySQLiteColumn => teams.id, { onDelete: 'set null' }),
})

export const usersRelations = relations(users, ({ many, one }) => ({
  sites: many(sites),
  toolLookups: many(toolLookups),
  feedback: many(feedback),
  mcpUsage: many(mcpUsage),
  notifications: many(notifications),
  ownedTeams: many(teams),
  teamMemberships: many(teamMemberships),
  identities: many(userIdentities),
  currentTeam: one(teams, {
    fields: [users.currentTeamId],
    references: [teams.id],
    relationName: 'currentTeam',
  }),
}))

// Sign-in identities. One row per (user, provider). Identity != integration:
// GSC tokens / discord IDs / github org-invite flags stay on `users` because
// those are per-feature grants. This table answers "who are you?", not "what
// can the app do on your behalf?". See google-signin-plan.md (Round 6).
export type AuthProviderId = 'github' | 'google'

export const userIdentities = sqliteTable('user_identities', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').$type<AuthProviderId>().notNull(),
  providerUserId: text('provider_user_id').notNull(),
  // Nullable: 33% of legacy GitHub sign-ups have no verified github_email or
  // stripe_email on record. providerUserId (`sub`) is the primary identifier;
  // email is only used as a cross-provider matching hint.
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  linkedAt: integer('linked_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  primaryKey({ columns: [t.provider, t.providerUserId] }),
  uniqueIndex('user_identities_user_provider_unique').on(t.userId, t.provider),
  index('user_identities_email_idx').on(t.email),
  index('user_identities_user_idx').on(t.userId),
])

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, { fields: [userIdentities.userId], references: [users.id] }),
}))

export type UserIdentity = typeof userIdentities.$inferSelect
export type NewUserIdentity = typeof userIdentities.$inferInsert

// Teams (Jetstream-spec). Owner is teams.ownerId only — never a role on the pivot.
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  personalTeam: integer('personal_team', { mode: 'boolean' }).notNull().default(false),
  // B3 R2: 1:1 mirror id from gscdump.com partner /teams. Nullable until backfill
  // populates it; mirror failures land in `notifications` and the reconciliation
  // cron retries. See `.claude/context/teams-b3-plan.md`.
  gscdumpTeamId: text('gscdump_team_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.ownerId], references: [users.id] }),
  memberships: many(teamMemberships),
  invitations: many(teamInvitations),
}))

export type TeamRole = 'admin' | 'editor' | 'viewer'

// team_memberships: pivot for non-owner members. Owner has NO row here.
export const teamMemberships = sqliteTable('team_memberships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  firstVisitDismissedAt: integer('first_visit_dismissed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('team_memberships_team_user_unique').on(t.teamId, t.userId),
])

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  team: one(teams, { fields: [teamMemberships.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMemberships.userId], references: [users.id] }),
}))

export const teamInvitations = sqliteTable('team_invitations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  invitedById: text('invited_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('team_invitations_team_email_unique').on(t.teamId, t.email),
])

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, { fields: [teamInvitations.teamId], references: [teams.id] }),
  invitedBy: one(users, { fields: [teamInvitations.invitedById], references: [users.id] }),
}))

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMembership = typeof teamMemberships.$inferSelect
export type TeamInvitation = typeof teamInvitations.$inferSelect

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

// Append-only activity log for team mutations. Surfaces on team settings.
// Actor FK is `set null` so user deletion preserves the audit trail.
export const teamAuditEvents = sqliteTable('team_audit_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  kind: text('kind').$type<TeamAuditEventKind>().notNull(),
  // Optional pointer to the affected entity for richer rendering.
  // e.g. ('user', '<userId>') for role changes; ('invitation', '<invitationId>') for invites.
  targetType: text('target_type'),
  targetId: text('target_id'),
  // Free-form context for rendering: target email, old/new role, old/new team name, etc.
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  index('team_audit_events_team_created_idx').on(t.teamId, sql`${t.createdAt} desc`),
])

export const teamAuditEventsRelations = relations(teamAuditEvents, ({ one }) => ({
  team: one(teams, { fields: [teamAuditEvents.teamId], references: [teams.id] }),
  actor: one(users, { fields: [teamAuditEvents.actorUserId], references: [users.id] }),
}))

export type TeamAuditEvent = typeof teamAuditEvents.$inferSelect
export type NewTeamAuditEvent = typeof teamAuditEvents.$inferInsert

// Team-scoped API tokens (Sanctum-style). Hashed at rest; plaintext shown once at creation.
// Bound to (team, user, role). MCP requests authenticated by these tokens are scoped to
// the team and gated by `can()` against the role — a viewer's token can't perform writes
// even if the user is an admin elsewhere.
export const teamApiTokens = sqliteTable('team_api_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  last4: text('last4').notNull(),
  label: text('label'),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).$type<TeamRole>().notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('team_api_tokens_token_hash_unique').on(t.tokenHash),
  index('team_api_tokens_team_idx').on(t.teamId),
])

export const teamApiTokensRelations = relations(teamApiTokens, ({ one }) => ({
  team: one(teams, { fields: [teamApiTokens.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamApiTokens.userId], references: [users.id] }),
}))

export type TeamApiToken = typeof teamApiTokens.$inferSelect
export type NewTeamApiToken = typeof teamApiTokens.$inferInsert

export type TeamGscCredentialStatus = 'active' | 'revoked' | 'failed'

// Pooled team GSC credentials. Any team member who connects gscdump contributes
// their GSC permissions to the team pool; sites bind to whichever credential has
// access. R1 ships additive only — readers still consume `users.gscdump*`.
// `(teamId, userId)` unique → one row per (team, connector). Cascade on team or
// user delete drops the row; sites cleared via `sites.gscdumpCredentialId` set null.
export const teamGscCredentials = sqliteTable('team_gsc_credentials', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gscdumpUserId: text('gscdump_user_id').notNull(),
  gscdumpApiKey: text('gscdump_api_key').notNull(),
  label: text('label'), // display: "Alice's Google"
  status: text('status', { enum: ['active', 'revoked', 'failed'] }).$type<TeamGscCredentialStatus>().notNull().default('active'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('team_gsc_credentials_team_user_unique').on(t.teamId, t.userId),
])

export const teamGscCredentialsRelations = relations(teamGscCredentials, ({ one }) => ({
  team: one(teams, { fields: [teamGscCredentials.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamGscCredentials.userId], references: [users.id] }),
}))

export type TeamGscCredential = typeof teamGscCredentials.$inferSelect
export type NewTeamGscCredential = typeof teamGscCredentials.$inferInsert

export { notifications }

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

// Per-user monthly token spend. Best-effort accrual on each turn's onFinish; nightly cron reconciles
// against the AI Gateway Logs API for ground truth. The endpoint reads this to enforce the COGS cap.
export const userMonthSpend = sqliteTable('user_month_spend', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ym: text('ym').notNull(),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  cacheReadTokens: integer('cache_read_tokens').notNull().default(0),
  cacheWriteTokens: integer('cache_write_tokens').notNull().default(0),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  primaryKey({ columns: [t.userId, t.ym] }),
])

export type UserMonthSpend = typeof userMonthSpend.$inferSelect
export type NewUserMonthSpend = typeof userMonthSpend.$inferInsert

export interface SiteProfile {
  type?: 'blog' | 'ecommerce' | 'saas' | 'docs' | 'portfolio' | 'agency' | 'other'
  industry?: string
  audience?: 'b2b' | 'b2c' | 'developers' | 'general'
  locale?: string
  contentTypes?: ('blog' | 'products' | 'docs' | 'landing')[]
  brandVoice?: 'formal' | 'casual' | 'technical'
  competitors?: string[]
  primaryKeywords?: string[]
  brandKeywords?: string[]
}

// Site groups for organizing sites in dashboard.
// Teams transition: teamId/userId are both nullable until backfill verified.
// Tighten teamId to NOT NULL in a follow-up migration once `SELECT COUNT(*) FROM
// site_groups WHERE team_id IS NULL` returns 0 in prod.
export const siteGroups = sqliteTable('site_groups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  // DEPRECATED: dead-weight column. No readers since reader-repoint (2026-04-28).
  // Drop is parked — D1 cannot drop FK'd columns. See `.claude/context/teams-status.md`.
  // Safe to null-fill via plain UPDATE if hygiene is wanted.
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const siteGroupsRelations = relations(siteGroups, ({ one, many }) => ({
  team: one(teams, {
    fields: [siteGroups.teamId],
    references: [teams.id],
  }),
  sites: many(sites),
}))

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  // DEPRECATED at the join level: no `eq(sites.userId, …)` queries remain. Route
  // through `requireSiteAccess`. Drop is parked — D1 cannot drop NOT-NULL FK'd
  // columns AND the unique index `sites_user_gscdump_site_url_unique` references
  // this column. See `.claude/context/teams-status.md` "B1 closeout PARKED".
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Teams Migration A: nullable, backfilled.
  // onDelete: 'restrict' — billing-adjacent + R2 screenshots; force explicit purge in DeleteTeam action.
  teamId: text('team_id').references(() => teams.id, { onDelete: 'restrict' }),
  groupId: text('group_id').references(() => siteGroups.id, { onDelete: 'set null' }),
  url: text('url'),
  name: text('name'),
  order: integer('order').default(0), // Display order for dashboard
  profile: text('profile', { mode: 'json' }).$type<SiteProfile>(),
  profiledAt: integer('profiled_at', { mode: 'timestamp' }),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  gscdumpSiteId: text('gscdump_site_id'), // gscdump.com site ID for GSC data
  gscdumpSiteUrl: text('gscdump_site_url'), // Simple domain registered with gscdump (e.g., 'nuxtseo.com')
  // B3 R1: pooled team GSC credential pointer. Backfilled to the team owner's
  // credential by 0030. Readers still consume `users.gscdump*`; flips in R2.
  gscdumpCredentialId: text('gscdump_credential_id').references(() => teamGscCredentials.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('sites_user_gscdump_site_url_unique').on(t.userId, t.gscdumpSiteUrl),
])

export const sitesRelations = relations(sites, ({ one }) => ({
  user: one(users, {
    fields: [sites.userId],
    references: [users.id],
  }),
  group: one(siteGroups, {
    fields: [sites.groupId],
    references: [siteGroups.id],
  }),
  gscdumpCredential: one(teamGscCredentials, {
    fields: [sites.gscdumpCredentialId],
    references: [teamGscCredentials.id],
  }),
}))

export const toolLookups = sqliteTable('tool_lookups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  tool: text('tool', { enum: ['keyword-research', 'serp-analyzer', 'domain-rankings', 'meta-tag-checker', 'social-share-debugger', 'xml-sitemap-validator', 'schema-validator'] }).notNull(),
  query: text('query').notNull(),
  params: text('params', { mode: 'json' }).$type<Record<string, unknown>>(),
  result: text('result', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const toolLookupsRelations = relations(toolLookups, ({ one }) => ({
  user: one(users, {
    fields: [toolLookups.userId],
    references: [users.id],
  }),
}))

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  path: text('path').notNull(),
  thumb: text('thumb', { enum: ['up', 'down'] }),
  comment: text('comment'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}))

export const mcpUsage = sqliteTable('pro_mcp_usage', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  // DEPRECATED: dead-weight column. No readers since reader-repoint (2026-04-28).
  // Drop is parked — D1 cannot drop FK'd columns. See `.claude/context/teams-status.md`.
  // Safe to null-fill via plain UPDATE if hygiene is wanted.
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Teams Migration A: nullable, backfilled. Activity log — cascade is fine.
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  teamApiTokenId: text('team_api_token_id').references(() => teamApiTokens.id, { onDelete: 'set null' }),
  sessionId: text('session_id').notNull(),
  endpoint: text('endpoint', { enum: ['mcp', 'mcp/pro'] }).notNull(),
  action: text('action', { enum: ['connect', 'tool_call', 'prompt_call', 'resource_read', 'disconnect'] }).notNull(),
  target: text('target'), // tool name, prompt name, or resource URI
  client: text('client'), // claude, cursor, windsurf, etc.
  status: text('status', { enum: ['success', 'error'] }).notNull().default('success'),
  responseTime: integer('response_time'), // ms
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  index('pro_mcp_usage_team_api_token_idx').on(t.teamApiTokenId),
])

export const mcpUsageRelations = relations(mcpUsage, ({ one }) => ({
  user: one(users, {
    fields: [mcpUsage.userId],
    references: [users.id],
  }),
}))

export type ApiUsageSource = 'mcp' | 'rest' | 'internal'
export type ApiUsageStatus = 'success' | 'error'

export const apiUsageEvents = sqliteTable('pro_api_usage_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  teamApiTokenId: text('team_api_token_id').references(() => teamApiTokens.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
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
}, t => [
  index('pro_api_usage_events_team_created_idx').on(t.teamId, sql`${t.createdAt} desc`),
  index('pro_api_usage_events_token_created_idx').on(t.teamApiTokenId, sql`${t.createdAt} desc`),
  index('pro_api_usage_events_team_source_created_idx').on(t.teamId, t.source, sql`${t.createdAt} desc`),
])

export const apiUsageEventsRelations = relations(apiUsageEvents, ({ one }) => ({
  team: one(teams, { fields: [apiUsageEvents.teamId], references: [teams.id] }),
  teamApiToken: one(teamApiTokens, { fields: [apiUsageEvents.teamApiTokenId], references: [teamApiTokens.id] }),
  user: one(users, { fields: [apiUsageEvents.userId], references: [users.id] }),
}))

export type ApiUsageEvent = typeof apiUsageEvents.$inferSelect
export type NewApiUsageEvent = typeof apiUsageEvents.$inferInsert

// Telemetry events: both anonymous (CI builds) and pro (licensed users)
export const telemetryEvents = sqliteTable('telemetry_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  // 'anonymous' = CI builds with hashed project, 'pro' = licensed user with real site URL
  source: text('source', { enum: ['anonymous', 'pro'] }).notNull(),
  // anonymous: SHA-256 hash of rootDir (16 chars), pro: null (use siteUrl instead)
  projectHash: text('project_hash'),
  // pro only: real site URL and user reference
  siteUrl: text('site_url'),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  // which nuxt-seo modules are enabled
  modules: text('modules', { mode: 'json' }).$type<string[]>().notNull(),
  moduleVersions: text('module_versions', { mode: 'json' }).$type<Record<string, string>>(),
  // sanitized config shape (booleans/counts only for anonymous, full features for pro)
  config: text('config', { mode: 'json' }).$type<Record<string, Record<string, boolean | string | number>>>(),
  // environment
  nuxtVersion: text('nuxt_version'),
  nodeVersion: text('node_version'),
  packageManager: text('package_manager'),
  os: text('os'),
  ci: text('ci'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const telemetryEventsRelations = relations(telemetryEvents, ({ one }) => ({
  user: one(users, {
    fields: [telemetryEvents.userId],
    references: [users.id],
  }),
}))

// Lighthouse (Synthetic CWV) tracking
// Pages the user has chosen to monitor for scheduled Lighthouse scans.
// Auto-seeded from GSC top-impressions on first Synthetic tab visit.
// A scan run = one Lighthouse audit of one monitored page (mobile only).
// Each scan produces one scan_route row (Unlighthouse models multi-page scans,
// but we run per-page to keep scheduling simple).
// Rolled-up image/script/stylesheet/font issues across the scan.
// For single-page scans this is still useful for showing top opportunities.
// Comparison of a scan against the prior scan of the same monitored page.

// Stripe webhook idempotency. PK on eventId — second insert of the same Stripe
// event id throws a UNIQUE conflict, which the handler catches to short-circuit.
export const stripeWebhookEvents = sqliteTable('stripe_webhook_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
})

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert

// Pro engagement events. Trial-state lifecycle events live in Stripe; this
// table is for in-product signals the drip cron uses (e.g. "GSC connected by
// day 2?"). Indexed by (userId, type) for the cron's per-user lookup.
export const proEvents = sqliteTable('pro_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, t => [
  index('pro_events_user_type_idx').on(t.userId, t.type),
])

export type ProEvent = typeof proEvents.$inferSelect
export type NewProEvent = typeof proEvents.$inferInsert

// Drip email sequences
export const dripEmails = sqliteTable('drip_emails', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  sequence: text('sequence').notNull(), // 'trial' (Stripe owns dunning/refund/renewal/expiring-card/trial-end-reminder emails)
  stepIndex: integer('step_index').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'cancelled'
  nextSendAt: integer('next_send_at', { mode: 'timestamp' }).notNull(),
  lastSentAt: integer('last_sent_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  uniqueIndex('drip_emails_email_sequence_unique').on(t.email, t.sequence),
])

// Append-only event log for Stripe billing webhooks (refunds, failed payments,
// disputes). Captures the *fact* of the event with enough metadata that the
// refund-postmortem dashboard / future churn analysis can read it.
// Idempotency: UNIQUE(kind, stripe_id) so listeners can safely replay.
export const billingEvents = sqliteTable('billing_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Stripe events always resolve to a user via stripe_customer_id; cascade-
  // delete on user purge is fine here (we keep team-level signals elsewhere).
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Nullable: legacy lifetime/personal events may not have a team.
  teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
  kind: text('kind', { enum: ['payment_failed', 'refunded', 'disputed'] }).notNull(),
  // Invoice id for payment_failed, charge id for refunded/disputed.
  stripeId: text('stripe_id').notNull(),
  // Amount in cents.
  amount: integer('amount').notNull(),
  // Stripe-provided reason on refunded/disputed; null on payment_failed.
  reason: text('reason'),
  // JSON blob for kind-specific extras (e.g. attempt_count for payment_failed,
  // refund-postmortem tag if/when set later).
  metadata: text('metadata'),
  // Unix ms.
  createdAt: integer('created_at').notNull(),
}, t => [
  uniqueIndex('billing_events_kind_stripe_id_unique').on(t.kind, t.stripeId),
  index('billing_events_user_kind_idx').on(t.userId, t.kind),
  index('billing_events_team_created_idx').on(t.teamId, t.createdAt),
])

export type BillingEvent = typeof billingEvents.$inferSelect
export type NewBillingEvent = typeof billingEvents.$inferInsert

// System-wide audit log NOT scoped to a user/team that gets nulled rather than
// cascade-deleted. Used for events like account-deletion where the user FK is
// gone by the time the audit lands.
export const adminEvents = sqliteTable('admin_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // The actor; null for system events (e.g. user.deleted fires after the
  // user row is gone). ON DELETE SET NULL preserves the audit trail.
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  // e.g. 'user.deleted', 'team.deleted', 'admin.override'.
  kind: text('kind').notNull(),
  // e.g. 'user', 'team', 'site'.
  targetType: text('target_type'),
  // String because target_type varies; for 'user.deleted' store the deleted
  // userId here.
  targetId: text('target_id'),
  // JSON blob; for 'user.deleted' include { email, stripe_customer_id }.
  metadata: text('metadata'),
  // Unix ms.
  createdAt: integer('created_at').notNull(),
}, t => [
  index('admin_events_kind_created_idx').on(t.kind, t.createdAt),
])

export type AdminEvent = typeof adminEvents.$inferSelect
export type NewAdminEvent = typeof adminEvents.$inferInsert

// Structured runtime errors persisted from the evlog `d1` drain. Stores every
// `logWarn` / `logError` call (see ADR-0022 + `shared/logging/`). Catalog
// `name` is the queryable index; `ctx` carries call-site context as JSON.
export const runtimeErrors = sqliteTable('runtime_errors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Unix ms.
  createdAt: integer('created_at').notNull(),
  // 'warn' | 'error' | 'fatal'.
  level: text('level').notNull(),
  // Catalog entry, e.g. 'agency_overage.meter_failed' (see shared/logging/catalog.ts).
  name: text('name').notNull(),
  // Optional human description (mirror of catalog value).
  description: text('description'),
  // evlog ParsedError shape stored as JSON: { name, message, stack, code, ... }.
  error: text('error'),
  // Free-form JSON: ids, hostnames, anything load-bearing to debugging.
  ctx: text('ctx'),
  // Request context the evlog Nuxt module passes through (path, requestId, userId).
  requestId: text('request_id'),
  userId: text('user_id'),
  path: text('path'),
}, t => [
  index('runtime_errors_name_created_idx').on(t.name, t.createdAt),
  index('runtime_errors_user_created_idx').on(t.userId, t.createdAt),
  index('runtime_errors_level_created_idx').on(t.level, t.createdAt),
])

export type RuntimeError = typeof runtimeErrors.$inferSelect
export type NewRuntimeError = typeof runtimeErrors.$inferInsert

// Type exports
export type McpUsage = typeof mcpUsage.$inferSelect
export type NewMcpUsage = typeof mcpUsage.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Site = typeof sites.$inferSelect
export type SiteGroup = typeof siteGroups.$inferSelect
export type NewSiteGroup = typeof siteGroups.$inferInsert
export type ToolLookup = typeof toolLookups.$inferSelect
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
export type TelemetryEvent = typeof telemetryEvents.$inferSelect
export type NewTelemetryEvent = typeof telemetryEvents.$inferInsert
export type DripEmail = typeof dripEmails.$inferSelect
export type NewDripEmail = typeof dripEmails.$inferInsert
