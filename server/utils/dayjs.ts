import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// Use the plugins
_dayjs.extend(utc)
_dayjs.extend(timezone)

export const dayjs = _dayjs
