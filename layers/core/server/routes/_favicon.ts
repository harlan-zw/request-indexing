import { proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  // proxy https://www.google.com/s2/favicons?domain=https://nuxtseo.com
  const { domain } = getQuery(event)
  return proxyRequest(event, `https://www.google.com/s2/favicons?domain=${domain}`)
})
