import type { H3Event } from 'h3'

export const ADMIN_EMAILS = ['harlan@harlanzw.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

export async function requireAdminAuth(event: H3Event) {
  const session = await getUserSession(event)
  if (!isAdminEmail(session?.user?.email)) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }
  return session
}
