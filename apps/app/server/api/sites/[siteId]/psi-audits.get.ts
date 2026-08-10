// TODO(v1): PSI audits deferred to v1.1 pro-perf layer.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: psi-audits endpoint deferred to v1.1 pro-perf layer.' })
})
