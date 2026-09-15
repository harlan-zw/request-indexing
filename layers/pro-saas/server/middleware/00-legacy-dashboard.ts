import { getRequestURL, sendRedirect } from 'h3'
import { mapLegacyDashboardPath } from '../../shared/legacy-dashboard-routes'

// Old dashboard links keep working. A route rule could only swap the prefix,
// and half the old pages moved further than that.
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const target = mapLegacyDashboardPath(url.pathname)
  if (!target)
    return

  return sendRedirect(event, `${target}${url.search}`, 301)
})
