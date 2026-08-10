const SCOPE_MAP: Record<string, { name: string, description: string, level: 'read' | 'write' | 'full' }> = {
  'email': { name: 'Email', description: 'View your email address', level: 'read' },
  'https://www.googleapis.com/auth/webmasters.readonly': { name: 'Search Console', description: 'View your Search Console data', level: 'read' },
  'https://www.googleapis.com/auth/webmasters': { name: 'Search Console', description: 'View and manage Search Console data', level: 'write' },
  'https://www.googleapis.com/auth/indexing': { name: 'Indexing API', description: 'Submit URLs for indexing', level: 'full' },
}

export interface ParsedScope {
  name: string
  description: string
  level: 'read' | 'write' | 'full'
  raw: string
}

export function useProGoogleScopes(scopeString: MaybeRefOrGetter<string | null | undefined>) {
  const parsedScopes = computed<ParsedScope[]>(() => {
    const str = toValue(scopeString)
    if (!str)
      return []

    return str.split(' ').map((scope) => {
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
    parsedScopes.value.some(s => s.level === 'write' || s.level === 'full'),
  )

  const hasIndexingScope = computed(() =>
    parsedScopes.value.some(s => s.raw === 'https://www.googleapis.com/auth/indexing'),
  )

  const hasSearchConsoleScope = computed(() =>
    parsedScopes.value.some(s =>
      s.raw === 'https://www.googleapis.com/auth/webmasters.readonly'
      || s.raw === 'https://www.googleapis.com/auth/webmasters',
    ),
  )

  return {
    parsedScopes,
    hasWriteAccess,
    hasIndexingScope,
    hasSearchConsoleScope,
  }
}
