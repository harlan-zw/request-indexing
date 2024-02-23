import type { ModelData } from '~/server/app/utils/unstorageEloquent'
import { defineUnstorageModel } from '~/server/app/utils/unstorageEloquent'
import { appStorage } from '~/server/app/storage'

export interface SiteData extends ModelData {
}


const Site = defineUnstorageModel<SiteData>({
  storage: appStorage,
  tableName: 'sites',
  keyName: 'domain',
  as: `payload.json`,
})
  .withMethods(instance => ({

  })
