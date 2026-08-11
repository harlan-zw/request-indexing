/**
 * Pro-SaaS layer schema seam.
 *
 * Re-exports the host's drizzle schema (now lifted into
 * `layers/core/server/db/schema.ts`). The pro-saas layer imports its tables
 * from here; never from `~~/layers/core/...` directly.
 *
 * Identity ripples (text-UUID → integer PK) are resolved in pro-saas-auth
 * Phase B (see `.plans/02-pro-saas-auth.md`). This file just plumbs the names.
 */

export {
  adminEvents,
  apiUsageEvents,
  feedback,
  googleAccounts,
  googleOAuthClients,
  indexingInvestigations,
  indexingJobs,
  mcpUsage,
  notifications,
  proEvents,
  runtimeErrors,
  sessions,
  siteGroups,
  sites,
  teamApiTokens,
  teamAuditEvents,
  teamGscCredentials,
  teamInvitations,
  teamMemberships,
  teams,
  telemetryEvents,
  userIdentities,
  users,
} from '~~/layers/core/server/db/schema'

export type {
  AdminEvent,
  ApiUsageEvent,
  ApiUsageSource,
  ApiUsageStatus,
  AuthProviderId,
  Feedback,
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
  IndexingInvestigation,
  IndexingJob,
  McpUsage,
  NewAdminEvent,
  NewApiUsageEvent,
  NewFeedback,
  NewIndexingInvestigation,
  NewIndexingJob,
  NewMcpUsage,
  NewNotification,
  NewProEvent,
  NewRuntimeError,
  NewSiteGroup,
  NewTeamApiToken,
  NewTeamAuditEvent,
  NewTeamGscCredential,
  NewTelemetryEvent,
  NewUser,
  NewUserIdentity,
  Notification,
  ProEvent,
  RuntimeError,
  Site,
  SiteGroup,
  Team,
  TeamApiToken,
  TeamAuditEvent,
  TeamAuditEventKind,
  TeamGscCredential,
  TeamGscCredentialStatus,
  TeamInvitation,
  TeamMembership,
  TeamRole,
  TelemetryEvent,
  User,
  UserIdentity,
} from '~~/layers/core/server/db/schema'
