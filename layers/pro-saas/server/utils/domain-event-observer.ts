import type { EventObserver, ObserverFallback } from '@harlan-zw/nuxt-domain-events/server'
import { logger } from '~~/shared/server/logger'

export const observeEventListener: EventObserver = (observation) => {
  if (observation._tag === 'listener-failed') {
    logger.error('[domain event listener failed]', {
      event: observation.eventName,
      listener: observation.listenerName,
      error: observation.error,
    })
  }
  if (observation._tag === 'dispatch-failed') {
    logger.error('[domain event dispatch failed]', {
      event: observation.eventName,
      error: observation.error,
    })
  }
}

export const observeEventListenerFallback: ObserverFallback = ({ observation, observerError }) => {
  logger.error('[domain event observer failed]', {
    event: observation.eventName,
    error: observerError,
  })
}
