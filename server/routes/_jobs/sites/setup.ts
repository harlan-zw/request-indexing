import dayjs from 'dayjs'
import { withLeadingSlash, withoutTrailingSlash } from 'ufo'
import type { SitePathSelect } from '~/server/database/schema'
import { siteDateAnalytics, sitePaths, sites } from '~/server/database/schema'
import { createSites, fetchGSCPages } from '#imports'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import type { GscPage } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      ownerPermissions: true,
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

  const user = site?.owner
  if (!site || !user) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const pages = await fetchGSCPages(user.googleAccounts[0], {
    period: {
      start: dayjs().subtract(30, 'day').toDate(),
      end: dayjs().subtract(1, 'day').toDate(),
    },
  }, site)

  let newSites = [site]
  if (site.property.startsWith('sc-domain') && !site.domain) {
    const domains: Record<string, Record<string, GscPage>> = {
      [withoutTrailingSlash(new URL(site.property.replace('sc-domain:', 'https://')).origin)]: {},
    }
    pages.forEach((row) => {
      const $url = new URL(row.page)
      const key = withoutTrailingSlash($url.origin) // just in case
      domains[key] = domains[key] || {}
      domains[key][withLeadingSlash($url.pathname)] = row
    })

    const domainKeys = await Promise.all(Object.keys(domains).filter(async (key) => {
      const res = await $fetch.raw<string>(key, {
        redirect: 'manual',
      })
        .catch(() => {
          return null
        })
      // just avoid redirect domains for now
      if (!res?._data || (res.status >= 300 && !res.headers.get('location')?.includes(key)))
        return null
      return key
    }))

    newSites = await createSites({
      sites: domainKeys.map((_site) => {
        return {
          ownerId: site.ownerId,
          sitemaps: site.sitemaps?.filter(s => s.path?.startsWith(_site)),
          property: site.property,
          domain: withoutTrailingSlash(_site),
          parentId: site.siteId,
          active: true,
          // lastSynced: Date.now(),
        }
      }),
      userSites: domainKeys.map(() => {
        return {
          permissionLevel: site.ownerPermissions?.permissionLevel,
        }
      }),
    }, user)

    await Promise.all(newSites.map(async (site) => {
      const pages = domains[site.domain!]
      if (!pages?.size)
        return
      const indexedPages = Object.entries(pages).map(([_, row]) => {
        return {
          ...row,
          isIndexed: true,
          path: new URL(row.page).pathname,
          siteId,
        }
      }) as any as SitePathSelect[]

      await chunkedBatch(indexedPages.map(row => db.insert(sitePaths).values(row).onConflictDoUpdate({
        target: [sitePaths.siteId, sitePaths.path],
        set: row,
      })))

      await db.insert(siteDateAnalytics).values({
        siteId,
        date: dayjs().format('YYYY-MM-DD'), // gcs format
        indexedPagesCount: indexedPages.length,
      }).onConflictDoUpdate({
        target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
        set: { indexedPagesCount: indexedPages.length },
      })
    }))
  }
  else {
    // console.log(pages)
    const indexedPages = pages.map((row) => {
      return {
        path: new URL(row.page).pathname,
        isIndexed: true,
        siteId,
      }
    }) as any as SitePathSelect[]

    if (indexedPages.length) {
      await chunkedBatch(indexedPages.map(row => db.insert(sitePaths).values(row).onConflictDoUpdate({
        target: [sitePaths.siteId, sitePaths.path],
        set: {
          isIndexed: true,
        },
      })))
    }

    await db.insert(siteDateAnalytics).values({
      siteId,
      date: dayjs().format('YYYY-MM-DD'), // gcs format
      indexedPagesCount: indexedPages.length,
    }).onConflictDoUpdate({
      target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
      set: { indexedPagesCount: indexedPages.length },
    })
  }

  // update parent site
  // await db.update(sites).set({
  //   lastSynced: Date.now(),
  // }).where(eq(sites.siteId, siteId))

  return {
    broadcastTo: user.publicId,
    sites: newSites.map(s => s.publicId),
  }
})
