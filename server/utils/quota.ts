import { datePST } from '~/server/utils/date'
import type { UserQuota } from '~/types'

export async function getUserQuotaUsage(userId: string, key: keyof UserQuota) {
  const quota = await getUserQuota(userId)
  return quota[key] || 0
}

export async function incrementUserQuota(userId: string, key: keyof UserQuota) {
  const quota = await getUserQuota(userId)
  quota[key] = (quota[key] || 0) + 1
  await userAppStorage(userId, 'quota').setItem(`${datePST()}.json`, quota)
  return quota[key]
}

export async function getUserQuota(userId: string) {
  return (await userAppStorage<UserQuota>(userId, 'quota').getItem(`${datePST()}.json`)) || { indexingApi: 0 } satisfies UserQuota
}
