interface ProActionErrorResponse {
  _proHandled?: boolean
}

function isHandledProActionError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error))
    return false

  const response = error.response
  return !!response
    && typeof response === 'object'
    && (response as ProActionErrorResponse)._proHandled === true
}

/**
 * Runs an authenticated Pro mutation. The shared fetch layer already surfaces
 * marked API failures, so callers only need to handle unmarked failures.
 */
export function proAction<T>(action: () => Promise<T>): Promise<T | undefined> {
  return action().catch((error: unknown) => {
    if (isHandledProActionError(error))
      return undefined
    throw error
  })
}
