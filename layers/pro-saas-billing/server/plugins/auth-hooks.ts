import type { StripePurchaseResult } from '../utils/stripe-purchases'
import { eq } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { useAuthHooks } from '#layers/pro-saas-auth/server/utils/auth/hooks'
import * as schema from '#layers/pro-saas/server/database'
import { findStripePurchaseByCheckoutSession, findStripePurchaseByEmails } from '../utils/stripe-purchases'

const { users } = schema

// pro-saas-billing auth-hooks subscriber: on every sign-in/create, attempt
// Stripe purchase correlation. Fallback path uses the stripe-checkout-session
// cookie set during the purchase wizard. If a checkout session points at a
// distinct webhook-stub user row, merge it into the signed-in user.
export default defineNitroPlugin(() => {
  const hooks = useAuthHooks()

  const correlate = async ({ event, user, identity }: { event: any, user: { id: string }, identity: any }) => {
    const db = useDrizzle(event)
    const verifiedEmails: string[] = [
      identity.email,
      ...(Array.isArray(identity.allVerifiedEmails) ? identity.allVerifiedEmails : []),
    ].filter(Boolean) as string[]

    let purchase: StripePurchaseResult = verifiedEmails.length
      ? await findStripePurchaseByEmails(event, verifiedEmails).catch((err) => {
          logger.error('[auth-hooks/billing] stripe lookup failed:', err)
          return { found: false }
        })
      : { found: false }

    if (!purchase.found) {
      const checkoutSessionId = getCookie(event, 'stripe-checkout-session')
      if (checkoutSessionId) {
        deleteCookie(event, 'stripe-checkout-session')
        const sessionPurchase = await findStripePurchaseByCheckoutSession(event, checkoutSessionId).catch((err) => {
          logger.error('[auth-hooks/billing] checkout session lookup failed:', err)
          return { found: false } as StripePurchaseResult
        })
        if (sessionPurchase.found) {
          purchase = sessionPurchase
          logger.log('[auth-hooks/billing] linked purchase via checkout session cookie:', checkoutSessionId)
        }
      }
    }

    if (!purchase.found)
      return

    // Webhook stub merge: a separate users row exists for this checkout session
    // (created by the Stripe webhook before sign-in). Delete the stub so the
    // signed-in user keeps the purchase columns.
    if (purchase.checkoutSessionId) {
      const stub = await db.query.users.findFirst({
        where: eq(users.stripeCheckoutSessionId, purchase.checkoutSessionId),
      }).catch(() => null)
      if (stub && stub.id !== user.id) {
        await db.delete(users).where(eq(users.userId, stub.id)).catch(err => logger.error('[auth-hooks/billing] merge delete failed:', err))
        logger.log('[auth-hooks/billing] merged webhook-created user:', stub.id, 'into:', user.id)
      }
    }

    await db.update(users)
      .set({
        stripeCustomerId: purchase.customerId,
        stripeEmail: purchase.email,
        stripePaymentIntentId: purchase.paymentIntentId,
        stripeCheckoutSessionId: purchase.checkoutSessionId,
        subscriptionId: purchase.subscriptionId,
        subscriptionStatus: purchase.subscriptionStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, user.id))
      .catch(err => logger.error('[auth-hooks/billing] update failed:', err))
  }

  hooks.hook('user:created', correlate as any)
  hooks.hook('user:signed-in', correlate as any)
})
