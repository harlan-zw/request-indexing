import { withoutTrailingSlash } from 'ufo'
import { sites, users } from '~/server/db/schema'
import { broadcastToUser } from '~/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'sites/setup',
  queue: 'default',
  async handle(payload, ctx) {
    const { siteId } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: {
        ownerPermissions: true,
        owner: true,
      },
      where: eq(sites.siteId, siteId),
    })

    const user = site?.owner
    if (!site || !user)
      throw new Error('Site or User not found')

    if (!user.gscdumpUserId)
      throw new Error('User not registered with gscdump')

    const gscdump = useGscdumpClient()
    const config = useRuntimeConfig()

    const registration = await gscdump.registerSite({
      userId: user.gscdumpUserId,
      siteUrl: site.property,
      webhookUrl: `${config.public.baseUrl}/api/webhooks/gscdump`,
    })

    await db.update(sites).set({
      gscdumpSiteId: registration.siteId,
      gscdumpSiteUrl: site.property,
      gscdumpSyncStatus: registration.status,
    }).where(eq(sites.siteId, siteId))

    // For domain properties, discover sub-domains
    if (site.property.startsWith('sc-domain') && !site.domain) {
      const { sites: availableSites } = await gscdump.getAvailableSites(user.gscdumpUserId)
      const domainBase = site.property.replace('sc-domain:', '')

      const childDomains = availableSites
        .filter(s => !s.siteUrl.startsWith('sc-domain:') && s.siteUrl.includes(domainBase))
        .map(s => withoutTrailingSlash(s.siteUrl))

      if (childDomains.length) {
        await createSites({
          sites: childDomains.map(domain => ({
            ownerId: site.ownerId,
            property: site.property,
            domain: withoutTrailingSlash(domain),
            parentId: site.siteId,
            active: true,
            gscdumpSiteId: registration.siteId,
            gscdumpSiteUrl: site.property,
            gscdumpSyncStatus: registration.status,
          })),
          userSites: childDomains.map(() => ({
            permissionLevel: site.ownerPermissions?.permissionLevel,
          })),
        }, user)
      }
    }

    // Broadcast result
    broadcastToUser(user.publicId, {
      name: 'sites/setup',
      entityId: siteId,
      entityType: 'site',
      payload: {
        gscdumpSiteId: registration.siteId,
        gscdumpStatus: registration.status,
      },
    })
  },
})
