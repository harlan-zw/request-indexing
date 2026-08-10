import { usages } from '~~/layers/core/server/db/schema'
import { currentPstDate } from '~~/layers/core/server/utils/dayjs'

export function incrementUsage(siteId: number, key: string) {
  return useDrizzle().insert(usages).values({
    siteId,
    date: currentPstDate(),
    key,
    usage: 1,
  }).onConflictDoUpdate({
    target: [usages.siteId, usages.date, usages.key],
    set: {
      usage: sql`${usages.usage} + 1`,
    },
  })
}
