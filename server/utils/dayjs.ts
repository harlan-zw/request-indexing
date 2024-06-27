import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// Use the plugins
_dayjs.extend(utc)
_dayjs.extend(timezone)

export const dayjs = _dayjs

export function currentPstDate() {
  return dayjs().tz('America/Los_Angeles').hour(12).minute(0).second(0).format('YYYY-MM-DD')
}
export function dayjsPst() {
  return dayjs().tz('America/Los_Angeles').hour(12).minute(0).second(0)
}
