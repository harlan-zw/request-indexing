export function faviconProxyPath(domain: string): string {
  return `/api/favicon?domain=${encodeURIComponent(domain)}&fallback=blank`
}

export function faviconFallbackInitial(fallbackLabel: string, domain: string): string {
  const source = fallbackLabel.trim() || domain.replace(/^www\./, '')
  return (source[0] ?? '?').toUpperCase()
}

export function isBlankFaviconSize(width: number, height: number): boolean {
  return width === 1 && height === 1
}
