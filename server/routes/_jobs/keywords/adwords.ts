import { sites } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { fetchKeywordIdeas } from '~/server/app/services/ads'

export default defineJobHandler(async (event) => {
  const { siteId, keywords } = await readBody<{ siteId: number, keywords: string[] }>(event)
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

  const res = await fetchKeywordIdeas(keywords, site.siteId)
  console.log('adwords job', res)
  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
  }
})
