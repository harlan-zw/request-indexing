import {
  GSC_INDEXING_SCOPE,
  GSC_READ_SCOPE,
  GSC_WRITE_SCOPE,
  hasIndexingScope as hasGscIndexingScope,
  hasGscReadScope,
  hasGscWriteScope,
  parseGrantedScopes,
} from 'gscdump'

const SCOPE_MAP: Record<string, { name: string, description: string, level: 'read' | 'write' | 'full' }> = {
  email: { name: 'Email', description: 'View your email address', level: 'read' },
  [GSC_READ_SCOPE]: { name: 'Search Console', description: 'View your Search Console data', level: 'read' },
  [GSC_WRITE_SCOPE]: { name: 'Search Console', description: 'View and manage Search Console data', level: 'write' },
  [GSC_INDEXING_SCOPE]: { name: 'Indexing API', description: 'Submit URLs for indexing', level: 'full' },
}

export interface ParsedScope {
  name: string
  description: string
  level: 'read' | 'write' | 'full'
  raw: string
}

export function useProGoogleScopes(scopeString: MaybeRefOrGetter<string | null | undefined>) {
  const scopes = computed(() => parseGrantedScopes(toValue(scopeString)))
  const parsedScopes = computed<ParsedScope[]>(() => {
    return scopes.value.map((scope) => {
      const mapped = SCOPE_MAP[scope]
      if (mapped) {
        return { ...mapped, raw: scope }
      }
      return {
        name: scope.split('/').pop() || scope,
        description: scope,
        level: 'read' as const,
        raw: scope,
      }
    })
  })

  const hasWriteAccess = computed(() =>
    hasGscWriteScope(scopes.value) || hasGscIndexingScope(scopes.value),
  )

  const hasIndexingScope = computed(() =>
    hasGscIndexingScope(scopes.value),
  )

  const hasSearchConsoleScope = computed(() =>
    hasGscReadScope(scopes.value),
  )

  return {
    parsedScopes,
    hasWriteAccess,
    hasIndexingScope,
    hasSearchConsoleScope,
  }
}
