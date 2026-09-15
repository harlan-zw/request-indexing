// Brand-term matching for Search Console queries. Pure functions, no Vue, no
// server imports: the control bar's Brand facet, the query label's brand badge
// and any future server-side classifier all read one definition of "branded".
//
// Ported from nuxtseo.com `layers/pro/sites/shared/brand-queries.ts`.

export const MAX_BRAND_KEYWORDS = 3
export const MAX_BRAND_KEYWORD_LENGTH = 80

/** Lowercase, trim and collapse whitespace for a user or profile brand term. */
export function normalizeBrandKeyword(term: string): string {
  return term.toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Fold to alphanumerics only: "Nuxt SEO", "nuxt-seo" and "nuxtseo" all align. */
export function foldBrandQuery(term: string): string {
  return normalizeBrandKeyword(term).replace(/[^a-z0-9]+/g, '')
}

/** Hostname-ish brand term with scheme and path stripped, dots preserved. */
function cleanHostLikeTerm(term: string): string {
  return normalizeBrandKeyword(term)
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0] ?? ''
}

/**
 * Variants used for broad brand reporting filters. Keeps the human spelling and
 * the folded spelling, plus the domain host and root-label forms.
 */
export function brandQueryVariants(term: string): string[] {
  const clean = cleanHostLikeTerm(term)
  if (!clean)
    return []

  const variants = new Set<string>([clean])
  const folded = foldBrandQuery(clean)
  if (folded)
    variants.add(folded)

  if (clean.includes('.')) {
    const firstLabel = clean.split('.')[0]
    if (firstLabel) {
      variants.add(firstLabel)
      const foldedFirstLabel = foldBrandQuery(firstLabel)
      if (foldedFirstLabel)
        variants.add(foldedFirstLabel)
    }
  }

  return [...variants]
}

interface NormalizeBrandKeywordsOptions {
  siteUrl?: string | null
  max?: number
}

function hostFromUrlLike(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed)
    return null
  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname.replace(/^www\./, '').toLowerCase()
  }
  catch {
    // Not a URL. The cleaned host-like form is still the best available answer,
    // so fall back to it rather than dropping the term.
    return cleanHostLikeTerm(trimmed).replace(/^www\./, '') || null
  }
}

/** Deduped lowercased brand terms, safe to persist or pass to a matcher. */
export function normalizeBrandKeywords(terms: readonly string[] | null | undefined, opts: NormalizeBrandKeywordsOptions = {}): string[] {
  const max = Math.max(0, opts.max ?? MAX_BRAND_KEYWORDS)
  const siteHost = opts.siteUrl ? hostFromUrlLike(opts.siteUrl) : null
  const out: string[] = []
  const seen = new Set<string>()

  for (const term of terms ?? []) {
    const normalized = normalizeBrandKeyword(term)
    if (!normalized || seen.has(normalized))
      continue
    if (siteHost && hostFromUrlLike(normalized) === siteHost)
      continue

    seen.add(normalized)
    out.push(normalized)
    if (out.length >= max)
      break
  }

  return out
}

function tokenSequence(term: string): string {
  return normalizeBrandKeyword(term).replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Exact brand intent: true only when the whole query is the brand term after
 * folding. Does not match modifiers such as "nuxt seo pricing".
 */
export function isExactBrandQuery(query: string | null | undefined, brandTerms: readonly string[] | null | undefined): boolean {
  const foldedQueries = new Set(
    brandQueryVariants(query ?? '')
      .map(foldBrandQuery)
      .filter(Boolean),
  )
  if (!foldedQueries.size)
    return false

  const exact = new Set(
    normalizeBrandKeywords(brandTerms)
      .flatMap(brandQueryVariants)
      .map(foldBrandQuery)
      .filter(Boolean),
  )
  return [...foldedQueries].some(q => exact.has(q))
}

/**
 * Broad brand reporting match: true when the query contains the brand term or
 * one of its folded or domain variants. Modifiers are included on purpose.
 */
export function isBroadBrandQuery(query: string | null | undefined, brandTerms: readonly string[] | null | undefined): boolean {
  if (!query)
    return false
  if (isExactBrandQuery(query, brandTerms))
    return true

  const tokenizedQuery = ` ${tokenSequence(query)} `
  const foldedQuery = foldBrandQuery(query)
  return normalizeBrandKeywords(brandTerms)
    .flatMap(brandQueryVariants)
    .some((variant) => {
      const tokenizedVariant = tokenSequence(variant)
      const foldedVariant = foldBrandQuery(variant)
      return (!!tokenizedVariant && tokenizedQuery.includes(` ${tokenizedVariant} `))
        || (!!foldedVariant && foldedVariant.length >= 4 && foldedQuery.includes(foldedVariant))
    })
}

/** A branded query with extra intent words, for example "nuxt seo pricing". */
export function isBrandModifiedQuery(query: string | null | undefined, brandTerms: readonly string[] | null | undefined): boolean {
  return isBroadBrandQuery(query, brandTerms) && !isExactBrandQuery(query, brandTerms)
}

/**
 * Deterministic fallback brand candidates from a site URL and optional display
 * name. Used before a site profile names its own brand terms.
 */
export function deriveUrlBrandKeywords(url: string | null | undefined, siteName?: string | null): string[] {
  const terms = new Set<string>()
  const hostname = url ? hostFromUrlLike(url) : null
  if (hostname) {
    const label = hostname.split('.')[0]
    if (label)
      terms.add(label)

    const split = label
      ?.replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .toLowerCase()
    if (split && split !== label)
      terms.add(split)
  }

  if (siteName)
    terms.add(siteName)

  return normalizeBrandKeywords([...terms], { siteUrl: url })
}
