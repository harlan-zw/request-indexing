import { expect, it } from 'vitest'
import { decodeRouteParam } from './route-params'

// The Pages table links a page URL through `encodeURIComponent`, so the whole
// URL arrives as one encoded segment. A hand-typed deep link arrives as the
// catch-all's array of raw segments. Both must read back as the same URL.
it('decodes a page URL the table encoded into one segment', () => {
  expect(decodeRouteParam('https%3A%2F%2Fexample.com%2Fblog%2Fpost'))
    .toBe('https://example.com/blog/post')
})

it('rejoins a catch-all that split on raw slashes', () => {
  expect(decodeRouteParam(['blog', 'post'])).toBe('blog/post')
})

it('reads a malformed percent sequence as itself rather than losing the route', () => {
  expect(decodeRouteParam('100%')).toBe('100%')
})

it('has no value for an absent parameter', () => {
  expect(decodeRouteParam(undefined)).toBeNull()
  expect(decodeRouteParam('')).toBeNull()
})
