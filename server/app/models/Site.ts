import { defineModel } from '~/server/app/utils/unstorageEloquent'
import type { SiteSelect } from '~/server/database/schema'
import { sites } from '~/server/database/schema'

export const Site = defineModel<SiteSelect>({
  schema: sites,
  keyName: 'siteId',
})
