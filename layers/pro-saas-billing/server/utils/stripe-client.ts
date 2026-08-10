// Single seam for Stripe SDK construction. Pin the API version once;
// every handler imports `useStripeClient(event)` instead of `new Stripe(...)`.

import type { H3Event } from 'h3'
import Stripe from 'stripe'

export const STRIPE_API_VERSION = '2026-04-22.dahlia' as const

export function useStripeClient(event: H3Event): Stripe {
  const config = useRuntimeConfig(event)
  return new Stripe(config.stripe.secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  })
}

export function siteUrl(event: H3Event): string {
  const host = getRequestHost(event, { xForwardedHost: true })
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  return `${proto}://${host}`
}
