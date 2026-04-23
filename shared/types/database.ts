// Re-export database types for use in both server and client
// These are inference types from the drizzle schema
export type {
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
  JobBatchInsert,
  JobBatchSelect,
  JobInsert,
  JobSelect,
  SiteDateAnalyticsSelect,
  SiteInsert,
  SiteKeywordDateAnalyticsSelect,
  SitePageSpeedInsightScansSelect,
  SitePathSelect,
  SiteSelect,
  SiteUrlDateAnalyticsSelect,
  TeamSelect,
  TeamSitesInsert,
  TeamSitesSelect,
  UserSelect,
  UserSitesInsert,
  UserSitesSelect,
} from '../../server/db/schema'
