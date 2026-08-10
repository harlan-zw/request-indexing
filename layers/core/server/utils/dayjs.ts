import { format, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'America/Los_Angeles'

function noonPst(): Date {
  const local = toZonedTime(new Date(), TZ)
  return setMilliseconds(setSeconds(setMinutes(setHours(local, 12), 0), 0), 0)
}

export function currentPstDate() {
  return format(noonPst(), 'yyyy-MM-dd')
}

export function dayjsPst() {
  return noonPst()
}
