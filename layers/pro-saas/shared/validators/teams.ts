import { z } from 'zod'

export const teamNameSchema = z.string().trim().min(1).max(60)
export const teamCreateSchema = z.object({ name: teamNameSchema })
export const teamUpdateSchema = z.object({ name: teamNameSchema })
export const teamRoleSchema = z.enum(['admin', 'editor', 'viewer'])
export const teamMemberRoleUpdateSchema = z.object({ role: teamRoleSchema })
export const teamTransferOwnershipSchema = z.object({ newOwnerUserId: z.string().min(1) })
