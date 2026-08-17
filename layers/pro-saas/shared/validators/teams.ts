import { z } from 'zod'

export const teamNameSchema = z.string().trim().min(1).max(60)
export const teamCreateSchema = z.object({ name: teamNameSchema })
export const teamUpdateSchema = z.object({ name: teamNameSchema })
export const teamRoleSchema = z.enum(['admin', 'editor', 'viewer'])
export const teamMemberRoleUpdateSchema = z.object({ role: teamRoleSchema })
export const teamTransferOwnershipSchema = z.object({ newOwnerUserId: z.string().min(1) })

// Onboarding: persist the team's selected GSC sites.
//
// This bound is a payload sanity ceiling, not the product limit. It used to say
// `.max(6, 'You can select up to 6 sites')` while the server enforced 3, so the
// same action produced two contradictory errors depending on how far over the
// caller was. The plan limit lives in one place, `checkTeamSiteSelection`
// (`apps/app/server/utils/team-site-limit.ts`), and the message the user reads
// comes from there.
export const teamSelectedSitesSchema = z.array(z.string().min(1)).max(100, 'Too many sites in one request')
export const teamOnboardingUpdateSchema = z.object({
  onboardedStep: z.string().trim().min(1).max(60).optional(),
  backupsEnabled: z.boolean().optional(),
  selectedSites: teamSelectedSitesSchema.default([]),
})
