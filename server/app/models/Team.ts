import { defineModel } from '~/server/app/utils/unstorageEloquent'
import type { TeamSelect } from '~/server/database/schema'
import { teams } from '~/server/database/schema'

export const Team = defineModel<TeamSelect>({
  schema: teams,
  keyName: 'teamId',
})

export type TeamModel = ReturnType<typeof Team.newModelInstance>
