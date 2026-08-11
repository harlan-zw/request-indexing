import { z } from 'zod'

export const teamNameSchema = z.string().trim().min(1).max(60)
export const teamCreateSchema = z.object({ name: teamNameSchema })
export const teamUpdateSchema = z.object({ name: teamNameSchema })
export const teamRoleSchema = z.enum(['admin', 'editor', 'viewer'])
export const teamMemberRoleUpdateSchema = z.object({ role: teamRoleSchema })
export const teamTransferOwnershipSchema = z.object({ newOwnerUserId: z.string().min(1) })

// Onboarding: persist the team's selected GSC sites + backup preference.
// `selectedSites` carries site `publicId`s, capped at the free-tier limit.
export const teamSelectedSitesSchema = z.array(z.string().min(1)).max(6, 'You can select up to 6 sites')
export const teamOnboardingUpdateSchema = z.object({
  onboardedStep: z.string().trim().min(1).max(60).optional(),
  backupsEnabled: z.boolean().optional(),
  selectedSites: teamSelectedSitesSchema.default([]),
})
