import { withHttps } from 'ufo'

export const normalizeSiteUrl = (siteUrl: string) => siteUrl.startsWith('sc-domain:') ? withHttps(`${siteUrl.split(':')[1]}/`) : siteUrl
