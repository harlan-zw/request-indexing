// TODO(v1): CrUX performance deferred to v1.1. nuxtseo.com pattern:
// `fetchCwvHistory(event, origin, 'origin', 'PHONE'/'DESKTOP')` from
// `pro-perf` layer. v0 read PSI tables locally.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: crux-performance endpoint deferred to v1.1 pro-perf layer.' })
})
