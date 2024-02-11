import { withHttps } from 'ufo'

export function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.startsWith('sc-domain:') ? withHttps(`${siteUrl.split(':')[1]}/`) : siteUrl
}

export function percentDifference(a?: number, b?: number) {
  if (!b || !a)
    return 0
  return ((a - b) / ((a + b) / 2)) * 100
}
