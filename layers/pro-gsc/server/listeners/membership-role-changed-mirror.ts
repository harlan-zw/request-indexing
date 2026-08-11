import type { AddPartnerTeamMemberParams } from '@gscdump/contracts'
import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { useGscdumpTeamsClient } from '../utils/gscdump-teams-client'
import { resolveGscdumpMirrorIds } from './_membership-mirror'

type GscdumpRole = AddPartnerTeamMemberParams['role']

export default defineListener({
  name: 'gsc.membership-role-changed-mirror',
  event: 'pro:membership:role-changed',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: async ({ event, teamId, userId, role }: EventPayload<'pro:membership:role-changed'>) => {
    const ids = await resolveGscdumpMirrorIds(event, teamId, userId)
    if (!ids)
      return
    await useGscdumpTeamsClient(event).updateMemberRole(
      ids.gscdumpTeamId,
      ids.gscdumpUserId,
      { role: role as GscdumpRole },
      { actorUserId: userId, proTeamId: teamId },
    )
  },
})
