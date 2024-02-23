export function normalizeUrlStorageKey(url: string) {
  // strip https, strip sc-domain, strip non-alphanumeric
  return url
    .replaceAll(':', '-')
    .replaceAll('/', '-')
    .replaceAll(' ', '-')
}
