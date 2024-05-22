import dayjs from 'dayjs'
import type { UserSelect } from '~/server/database/schema'

// const encryptKeys = ['loginTokens', 'indexingTokens']

export function userPeriodRange(user: UserSelect, options: { includeToday?: boolean } = {}) {
  const maximumDate = dayjs().subtract(options.includeToday ? -1 : 1, 'day').toDate()
  const periodRange = user.analyticsRange || user.analyticsPeriod || '30d'
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
      startDate: startPeriod.format('YYYY-MM-DD'),
      end: endPeriod.toDate(),
      endDate: endPeriod.format('YYYY-MM-DD'),
    },
    prevPeriod: {
      start: startPrevPeriod.toDate(),
      startDate: startPrevPeriod.format('YYYY-MM-DD'),
      end: endPrevPeriod.toDate(),
      endDate: endPrevPeriod.format('YYYY-MM-DD'),
    },
  }
}

// export const User = defineModel<UserSelect>({
//   schema: users,
//   keyName: 'userId',
// })
//   .withMethods(instance => ({
//     quota() {
//       return UserQuota.find(instance.getKey()) || { indexingApi: 0 }
//     },
//     periodRange() {
//       const maximumDate = dayjs().subtract(1, 'day').toDate()
//       const periodRange = instance.analyticsRange || instance.analyticsPeriod || '30d'
//       let startPeriod
//       let endPeriod
//       let startPrevPeriod
//       let endPrevPeriod
//       if (typeof periodRange === 'string') {
//         const periodDays = periodRange.includes('d')
//           ? Number.parseInt(periodRange.replace('d', ''))
//           : (Number.parseInt(periodRange.replace('mo', '')) * 30)
//
//         startPeriod = dayjs(maximumDate).subtract(periodDays, 'day')
//         endPeriod = dayjs(maximumDate)
//         startPrevPeriod = dayjs(maximumDate).subtract(periodDays * 2, 'day')
//         endPrevPeriod = dayjs(maximumDate).subtract(periodDays + 1, 'day')
//       }
//       else {
//         startPeriod = dayjs(periodRange.start)
//         endPeriod = dayjs(periodRange.end)
//         const dayDiff = endPeriod.diff(startPeriod, 'day')
//         // sub the days of the current period to generate prev period
//         startPrevPeriod = dayjs(periodRange.start).subtract(dayDiff, 'day')
//         endPrevPeriod = dayjs(periodRange.end).subtract(dayDiff, 'day')
//       }
//       return {
//         period: {
//           start: startPeriod.toDate(),
//           end: endPeriod.toDate(),
//         },
//         prevPeriod: {
//           start: startPrevPeriod.toDate(),
//           end: endPrevPeriod.toDate(),
//         },
//       }
//     },
//   }))
//   .withEventListeners({
//     saving(instance) {
//       instance.updatedAt = Date.now()
//       for (const key of encryptKeys) {
//         if (typeof instance[key] === 'object')
//           instance[key] = encryptToken(stringify(instance[key]), useRuntimeConfig().key)
//       }
//     },
//     retrieved(instance) {
//       for (const key of encryptKeys) {
//         if (typeof instance[key] === 'string')
//           instance[key] = parse(decryptToken(instance[key], useRuntimeConfig().key))
//       }
//     },
//   })
//
// export type UserModel = ReturnType<typeof User.newModelInstance>
