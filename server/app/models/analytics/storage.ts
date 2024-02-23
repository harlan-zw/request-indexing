import { prefixStorage } from 'unstorage'
import { appStorage } from '~/server/app/storage'

export async function incrementMetric(key: string) {
  const analytics = prefixStorage<number>(appStorage, 'analytics')
  const newVal = (await analytics.getItem(key) || 0) + 1
  await analytics.setItem(key, newVal)
  return newVal
}

export async function getMetric(key: string) {
  return (await prefixStorage<number>(appStorage, 'analytics').getItem(key)) || 0
}
