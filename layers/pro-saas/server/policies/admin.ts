import type { Caller } from '../../shared/caller'
import { ProError } from '../../shared/errors'

export function assertAdmin(caller: Caller): void {
  if (!caller.isAdmin)
    throw new ProError('forbidden', { message: 'Admin access required' })
}
