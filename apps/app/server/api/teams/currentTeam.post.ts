// TODO(v1): re-implement team onboarding / site selection once V1 team shape is settled.
// The previous implementation depended on dropped User.googleAccounts and a
// non-registered `app:team:sites-selected` Nitro hook.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'Not Implemented' })
})
