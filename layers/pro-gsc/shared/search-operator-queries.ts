// Google search-operator queries are not rankings, so they must never reach a
// keyword list. `site:example.com` restricts the corpus: "position 5" means
// fifth among that site's own pages, and it converts at 0% by construction.
//
// Ported from nuxtseo.com `layers/pro/sites/shared/search-operator-queries.ts`.

/**
 * Operators that unambiguously mark a query as an operator string rather than a
 * natural search. Deliberately conservative: every entry is meaningless as
 * natural language. `before:`, `after:` and `link:` are omitted as too close to
 * ordinary words, and `cache:` is omitted because Google retired it in 2024
 * while `cache:redis` stayed a plausible human query.
 */
const SEARCH_OPERATORS = [
  'site',
  'inurl',
  'intitle',
  'intext',
  'allintitle',
  'allinurl',
  'allintext',
  'filetype',
  'related',
] as const

/**
 * Matches an operator anywhere in the query, including the negated form
 * (`-site:github.com`) and mid-string use.
 *
 * The trailing `\S` is load-bearing. A Google operator never has whitespace
 * after its colon, but source code does, and a developer site gets a lot of
 * source code pasted into the search box. Without it, real searches such as
 * `"http: { cache: { enabled" nuxt` are dropped from the customer's own report.
 */
const SEARCH_OPERATOR_RE = new RegExp(`(?:^|\\s|-)(?:${SEARCH_OPERATORS.join('|')}):\\S`, 'i')

export function isSearchOperatorQuery(query: string | null | undefined): boolean {
  return !!query && SEARCH_OPERATOR_RE.test(query)
}

/**
 * Extra rows to request so that dropping operator rows still leaves a full list.
 * Only rows that reach the top of an ordering can displace real ones, so the
 * size is set by density, not by the total operator count.
 */
export const OPERATOR_QUERY_HEADROOM = 10

/**
 * A single keyword field, blanked when it is an operator string. There is no
 * next-best row to promote for a "top keyword" field, so the honest answer is
 * "no keyword" rather than a search nobody ran.
 */
export function operatorFreeKeyword(query: string | null | undefined): string | null {
  return !query || isSearchOperatorQuery(query) ? null : query
}

/** Drop operator rows, then trim back to the caller's intended length. */
export function withoutSearchOperatorRows<T>(
  rows: readonly T[],
  key: (row: T) => string | null | undefined,
  limit?: number,
): T[] {
  const kept = rows.filter(row => !isSearchOperatorQuery(key(row)))
  return limit == null ? kept : kept.slice(0, limit)
}
