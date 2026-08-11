import { z } from 'zod'

// Kept in sync with `accountDeleteReasons` in
// `layers/pro-saas/server/actions/account.ts`.
export const accountDeleteReasonSchema = z.enum([
  'missing_features',
  'too_expensive',
  'not_using',
  'switched_tool',
  'privacy',
  'technical_issues',
  'other',
])

export const deleteAccountBodySchema = z.object({
  feedback: z.object({
    reasons: z.array(accountDeleteReasonSchema).optional(),
    comment: z.string().trim().max(1000).optional(),
  }).optional(),
}).optional()

export const profileUpdateSchema = z.object({
  analyticsPeriod: z.string().trim().min(1).max(20).optional(),
  analyticsRange: z.unknown().optional(),
})
