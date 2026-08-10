import type { DropdownMenuItem } from '@nuxt/ui'

export interface ProUserMenuItem extends DropdownMenuItem {
  badge?: string
  badgeColor?: 'primary' | 'error' | 'warning' | 'success' | 'info' | 'neutral'
}

export interface ProUserMenuTopLink {
  label: string
  icon: string
  to: string
}

export interface ProUserMenuOptions {
  openLicense: () => void
  openFeedback?: () => void
  /** Optional context-specific link prepended to the menu (e.g. "All Sites", "Dashboard"). */
  topLink?: ProUserMenuTopLink
}

export function useProUserMenu(options: ProUserMenuOptions) {
  // Pending-invitations badge deferred to follow-up; default 0.
  const pendingInviteCount = ref(0)

  function signOut() {
    if (import.meta.client)
      window.location.assign('/auth/logout')
  }

  const items = computed<ProUserMenuItem[][]>(() => {
    const personal: ProUserMenuItem[] = []

    if (options.topLink)
      personal.push({ ...options.topLink })

    personal.push({
      label: 'Account',
      icon: 'i-lucide-user',
      to: '/pro/dashboard/account',
    })

    const teamsItem: ProUserMenuItem = {
      label: 'Teams',
      icon: 'i-lucide-users',
      to: '/pro/dashboard/teams',
    }
    if (pendingInviteCount.value > 0) {
      teamsItem.badge = String(pendingInviteCount.value)
      teamsItem.badgeColor = 'primary'
    }
    personal.push(teamsItem)

    personal.push({
      label: 'License Key',
      icon: 'i-lucide-key-round',
      onSelect: () => options.openLicense(),
    })

    const resources: ProUserMenuItem[] = [{
      label: 'Documentation',
      icon: 'i-lucide-book-open',
      to: '/pro/docs/getting-started/introduction',
    }, {
      label: 'Support',
      icon: 'i-lucide-life-buoy',
      to: '/pro/dashboard/support',
    }]

    if (options.openFeedback) {
      const openFeedback = options.openFeedback
      resources.push({
        label: 'Send feedback',
        icon: 'i-lucide-megaphone',
        onSelect: () => openFeedback(),
      })
    }

    const signOutItems: ProUserMenuItem[] = [{
      label: 'Sign Out',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: signOut,
    }]

    return [personal, resources, signOutItems]
  })

  return { items, pendingInviteCount }
}
