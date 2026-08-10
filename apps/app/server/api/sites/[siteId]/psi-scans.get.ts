// TODO(v1): PSI scans deferred to v1.1 pro-perf layer.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: psi-scans endpoint deferred to v1.1 pro-perf layer.' })
})
