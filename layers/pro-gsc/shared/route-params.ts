/**
 * Read one route parameter back as the string the link encoded.
 *
 * A catch-all segment (`[...page]`) arrives as an array when the value carried
 * raw slashes and as a string when the link percent-encoded it. Both spellings
 * mean the same URL, so join first and decode once.
 *
 * A malformed percent sequence throws inside `decodeURIComponent`. Return the
 * raw value in that case: a link that cannot be decoded is still better read
 * as itself than as `null`.
 */
export function decodeRouteParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value.join('/') : value
  if (!raw)
    return null
  try {
    return decodeURIComponent(raw)
  }
  catch {
    return raw
  }
}
