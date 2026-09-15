import type { SitemapLiveness } from '../../shared/contracts/sitemap-liveness'

interface SitemapEmptyStateInput {
  liveness: SitemapLiveness | null
  pending: boolean
  unavailable: boolean
}

export type SitemapEmptyState
  = | { _tag: 'checking' }
    | {
      _tag: 'retry'
      title: string
      description: string
      actionLabel: string
    }
    | {
      _tag: 'install' | 'submit' | 'repair'
      title: string
      description: string
      actionLabel: string
      actionTo?: string
    }

export function resolveSitemapEmptyState(input: SitemapEmptyStateInput): SitemapEmptyState {
  if (input.pending)
    return { _tag: 'checking' }

  if (input.unavailable || !input.liveness) {
    return {
      _tag: 'retry',
      title: 'Live sitemap check unavailable',
      description: 'Retry the check before changing sitemap configuration.',
      actionLabel: 'Retry live check',
    }
  }

  if (input.liveness.status === 'reachable') {
    return {
      _tag: 'submit',
      title: 'Submit your live sitemap to Search Console',
      description: 'The sitemap is reachable, but Google has no submitted sitemap report for it.',
      actionLabel: 'Open Search Console',
    }
  }

  if (input.liveness.statusCode === 404) {
    return {
      _tag: 'install',
      title: 'No sitemap found at /sitemap.xml',
      description: 'Generate a sitemap for this site, then submit it in Search Console.',
      actionLabel: 'Open Search Console',
    }
  }

  return {
    _tag: 'repair',
    title: input.liveness.status === 'timeout'
      ? 'Live sitemap check timed out'
      : 'Live sitemap check failed',
    description: 'Validate `/sitemap.xml`, repair the response, then submit it in Search Console.',
    actionLabel: 'Validate sitemap',
  }
}
