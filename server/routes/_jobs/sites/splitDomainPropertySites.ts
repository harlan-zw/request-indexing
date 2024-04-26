import dayjs from 'dayjs'
import {
  sites,
} from '~/server/database/schema'
import { createSites } from '#imports'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

// this may be run at site creation or at a later date to sync sites
export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      ownerPermissions: true,
      owner: true,
    },
    where: eq(sites.siteId, siteId),
  })

  // need to get the users with permissions to this site

  // const [site] = await Promise.all([
  //   db.query.sites.findFirst({
  //     where: eq(sites.siteId, siteId),
  //     // with: {
  //     //   userTeamSites: {
  //     //     where: eq(userTeamSites.userId, userId),
  //     //   },
  //     // },
  //   }),
  //   db.query.users.findFirst({
  //     where: eq(users.userId, userId),
  //   }),
  // ])

  const user = site.owner

  if (!site || !user) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const pages = await fetchGSCPages(user.loginTokens, {
    period: {
      start: dayjs().subtract(28, 'day').toDate(),
      end: dayjs().subtract(1, 'day').toDate(),
    },
  }, site)
  // we need to fetch pages for last 30 days to figure out subdomains
  // TODO parralel

  if (!pages.rows.length) {
    // no pages, all okay?
    return 'OK'
  }
  const distinctDomains = new Set<string>([
    new URL(site.property.replace('sc-domain:', 'https://')).origin,
  ])
  pages.rows.forEach((row) => {
    distinctDomains.add(new URL(row.page).origin)
  })

  await createSites({
    sites: [...distinctDomains].map((_site) => {
      return {
        ownerId: site.ownerId,
        sitemaps: site.sitemaps?.filter(s => s.path?.startsWith(_site)),
        property: site.property,
        domain: _site,
        parentId: site.siteId,
        active: true,
      }
    }),
    userSites: [...distinctDomains].map((_sitxe) => {
      return {
        permissionLevel: site.ownerPermissions?.permissionLevel,
      }
    }),
  }, user)

  return { status: 'OK' }
})
