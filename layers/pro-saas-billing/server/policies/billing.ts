import type { Caller } from '#layers/pro-saas/shared/caller'
import { canWrite, hasProAccess, isReadOnly } from '#layers/pro-saas/shared/caller-policy'
import { ProError } from '#layers/pro-saas/shared/errors'

export function assertProAccess(caller: Caller, plan: 'pro' = 'pro'): void {
  if (!hasProAccess(caller, plan))
    throw new ProError('subscription_required', { details: { plan } })
}

export function assertWriteAccess(caller: Caller): void {
  if (isReadOnly(caller))
    throw new ProError('read_only')
  if (!canWrite(caller))
    throw new ProError('subscription_required')
}
