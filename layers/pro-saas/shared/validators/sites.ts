import { z } from 'zod'

export const siteUrlSchema = z.string().url().max(2048)
export const siteVerifySchema = z.object({
  url: siteUrlSchema,
  teamId: z.string().min(1),
})
