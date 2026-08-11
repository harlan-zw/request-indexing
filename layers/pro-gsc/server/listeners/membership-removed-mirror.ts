import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { useGscdumpTeamsClient } from '../utils/gscdump-teams-client'
import { resolveGscdumpMirrorIds } from './_membership-mirror'

export default defineListener({
  name: 'gsc.membership-removed-mirror',
  event: 'pro:membership:removed',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: async ({ event, teamId, userId }: EventPayload<'pro:membership:removed'>) => {
    const ids = await resolveGscdumpMirrorIds(event, teamId, userId)
    if (!ids)
      return
    await useGscdumpTeamsClient(event).removeMember(
      ids.gscdumpTeamId,
      ids.gscdumpUserId,
      { actorUserId: userId, proTeamId: teamId },
    )
  },
})
