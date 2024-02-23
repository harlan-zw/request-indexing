import dayjs from 'dayjs'
import { parse, stringify } from 'devalue'
import { datePST } from '../utils/formatting'
import type { Model, ModelData } from '~/server/app/utils/unstorageEloquent'
import { defineUnstorageModel } from '~/server/app/utils/unstorageEloquent'
import type {GoogleSearchConsoleSite, UserOAuthToken} from '~/types'
import { appStorage } from '~/server/app/storage'
import { decryptToken, encryptToken } from '~/server/app/utils/crypto'

export interface UserData extends ModelData {
  // google oauth
  userId: string // key
  email: string
  picture: string
  sub: string

  // login
  lastLogin: number
  loginTokens: UserOAuthToken

  // onboarding
  selectedSites?: string[]
  backupsEnabled?: boolean
  onboardedStep?: 'sites-and-backup'

  // core services
  sites?: GoogleSearchConsoleSite[]
  analyticsRange?: { start: Date, end: Date }
  analyticsPeriod?: 'all' | '30d' | string

  // indexing api
  indexingTokens?: UserOAuthToken
  indexingOAuthId?: string
  lastIndexingOAuthId?: string
}


export interface UserQuotaData extends ModelData {
  indexingApi: 0
}

const UserQuota = defineUnstorageModel<UserQuotaData>({
  storage: appStorage,
  tableName: 'users',
  keyName: 'user_id',
  as: `quota:${datePST()}.json`,
})

const encryptKeys = ['loginTokens', 'indexingTokens']

export type UserModel = typeof User

export const User = defineUnstorageModel<UserData>({
  storage: appStorage,
  tableName: 'users',
  keyName: 'userId',
  as: 'me.json',
})
  .withMethods(instance => ({
    foo() {
      return 'bar'
    },
    quota() {
      return UserQuota.find(instance.getKey()) || { indexingApi: 0 }
    },
    periodRange() {
      const maximumDate = dayjs().subtract(1, 'day').toDate()
      const periodRange = instance.analyticsRange || instance.analyticsPeriod
      let startPeriod
      let endPeriod
      let startPrevPeriod
      let endPrevPeriod
      if (typeof periodRange === 'string') {
        const periodDays = periodRange.includes('d')
          ? Number.parseInt(periodRange.replace('d', ''))
          : (Number.parseInt(periodRange.replace('mo', '')) * 30)

        startPeriod = dayjs(maximumDate).subtract(periodDays, 'day')
        endPeriod = dayjs(maximumDate)
        startPrevPeriod = dayjs(maximumDate).subtract(periodDays * 2, 'day')
        endPrevPeriod = dayjs(maximumDate).subtract(periodDays + 1, 'day')
      }
      else {
        startPeriod = dayjs(periodRange.start)
        endPeriod = dayjs(periodRange.end)
        const dayDiff = endPeriod.diff(startPeriod, 'day')
        // sub the days of the current period to generate prev period
        startPrevPeriod = dayjs(periodRange.start).subtract(dayDiff, 'day')
        endPrevPeriod = dayjs(periodRange.end).subtract(dayDiff, 'day')
      }
      return {
        period: {
          start: startPeriod.toDate(),
          end: endPeriod.toDate(),
        },
        prevPeriod: {
          start: startPrevPeriod.toDate(),
          end: endPrevPeriod.toDate(),
        },
      }
    },
  }))
  .withEventListeners({
    saving(instance) {
      instance.updatedAt = Date.now()
      for (const key of encryptKeys) {
        if (typeof instance[key] === 'object')
          instance[key] = encryptToken(stringify(instance[key]), useRuntimeConfig().key)
      }
    },
    retrieved(instance) {
      for (const key of encryptKeys) {
        if (typeof instance[key] === 'string')
          instance[key] = parse(decryptToken(instance[key], useRuntimeConfig().key))
      }
    },
  })
