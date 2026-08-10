import { z } from 'zod'

export const apiTokenNameSchema = z.string().trim().min(1).max(60)
export const apiTokenCreateSchema = z.object({
  name: apiTokenNameSchema,
  role: z.enum(['admin', 'editor', 'viewer']),
})
