// Builds nav links for /pro/dashboard/sites/[id]/* from the registry. The
// 547-line layout used to inline all of these; with the registry, each
// pro-* layer's addProSiteFeature() declares the entry, including its
// integration prerequisite + locked-copy.
//
// Caller passes the per-integration lock-state map (the layout owns runtime
// signals like `gscNavLockState` so they stay reactive). The composable
// just maps `feature.integration` → the matching lock state ref.

import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { IntegrationReadiness } from '../../shared/policies/integration-readiness'
import { computed, toValue } from 'vue'
import { useProFeatureRegistry } from './useProFeatureRegistry'

export interface ProSiteNavLink {
  id: string
  label: string
  icon?: string
  to: string
  active?: (path: string) => boolean
  lockState?: 'enabled' | 'pending' | 'locked'
  lockedDescription?: string
  lockedUnlockLabel?: string
  lockedUnlockTo?: string
}

export type ProGatingLockState = 'enabled' | 'pending' | 'locked'

export interface UseProSiteNavOptions {
  /** Map of integration-readiness keys to their current runtime lock state. */
  lockStateByIntegration?: Partial<Record<IntegrationReadiness, MaybeRefOrGetter<ProGatingLockState | undefined>>>
}

export function useProSiteNav(
  siteId: MaybeRefOrGetter<string>,
  options: UseProSiteNavOptions = {},
): { mainLinks: ComputedRef<ProSiteNavLink[]>, siteLinks: ComputedRef<ProSiteNavLink[]> } {
  const { features, topNavOrder } = useProFeatureRegistry()

  const expandTo = (to: string, id: string) => to.replace(/:id\(\)|:slug\(\)|\[id\]|\[slug\]/g, id)

  const links = computed<ProSiteNavLink[]>(() => {
    const id = toValue(siteId)
    if (!id)
      return []
    const base = `/dashboard/site/${id}`
    const out: ProSiteNavLink[] = [
      { id: 'overview', label: 'Overview', icon: 'i-lucide-app-window', to: base, active: p => p === base },
    ]
    const ordered = topNavOrder
      .map(fid => features[fid])
      .filter((f): f is NonNullable<typeof f> => !!f)
    for (const feature of ordered) {
      const featurePath = expandTo(`/dashboard/site/[slug]/${feature.id}`, id)
      const lockSrc = feature.integration ? options.lockStateByIntegration?.[feature.integration] : undefined
      const lockState = lockSrc ? toValue(lockSrc) : undefined
      out.push({
        id: feature.id,
        label: feature.label,
        icon: feature.icon,
        to: featurePath,
        active: p => p === featurePath || p.startsWith(`${featurePath}/`),
        lockState,
        lockedDescription: feature.lockedDescription,
        lockedUnlockLabel: feature.lockedUnlockLabel,
        lockedUnlockTo: feature.lockedUnlockTo,
      })
    }
    return out
  })

  const mainGroups = new Set<string>(['visibility', 'health'])
  const mainLinks = computed(() =>
    links.value.filter(l => l.id === 'overview' || mainGroups.has(features[l.id]?.group ?? '')),
  )
  const siteLinks = computed(() =>
    links.value.filter(l => l.id !== 'overview' && !mainGroups.has(features[l.id]?.group ?? '')),
  )

  return { mainLinks, siteLinks }
}
