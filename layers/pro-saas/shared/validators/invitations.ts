import { z } from 'zod'
import { teamRoleSchema } from './teams'

export const invitationEmailSchema = z.string().email().toLowerCase()
export const invitationCreateSchema = z.object({
  email: invitationEmailSchema,
  role: teamRoleSchema,
})
export const invitationTokenSchema = z.string().regex(/^inv_[a-f0-9]{32}$/, 'Invalid invitation token')
export const invitationAcceptSchema = z.object({ token: invitationTokenSchema })
