import dayjs from 'dayjs'
import { sitePathDateAnalytics, sites } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { inspectGscUrl } from '~/server/app/services/gsc'
import { incrementUsage } from '~/server/app/services/usage'

export default defineJobHandler(async (event) => {
  const { siteId, path } = await readBody<{ siteId: number, path: string }>(event)
  const db = useDrizzle()

  const site = await db.query.sites.findFirst({
    with: {
      owner: {
        with: {
          googleAccounts: {
            with: {
              googleOAuthClient: true,
            },
          },
        },
      },
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner || !site.owner.googleAccounts[0]) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const existing = await db.query.sitePathDateAnalytics.findFirst({
    where: and(
      eq(sitePathDateAnalytics.siteId, siteId),
      eq(sitePathDateAnalytics.date, dayjs().format('YYYY-MM-DD')),
      eq(sitePathDateAnalytics.path, path),
    ),
  })

  if (existing) {
    return {
      res: 'Already run',
    }
  }
  await incrementUsage(site.siteId, 'gscInspectUrl')
  const res = await inspectGscUrl(site.owner.googleAccounts[0], site, path)
  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    path,
    verdict: res.inspection.inspectionResult?.indexStatusResult?.verdict,
  }
})
