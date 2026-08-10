interface EngagementNotice {
  description?: string
  title: string
}

const engagementNotices = {
  first_sync: {
    title: 'First sync complete',
    description: 'Your Search Console data is ready.',
  },
  gsc: {
    title: 'Search Console connected',
    description: 'Your data will start syncing shortly.',
  },
  welcome: {
    title: 'Welcome to Request Indexing Pro',
  },
} as const satisfies Record<string, EngagementNotice>

type EngagementFlag = keyof typeof engagementNotices

function activeEngagementFlags(query: Record<string, unknown>): EngagementFlag[] {
  return (Object.keys(engagementNotices) as EngagementFlag[])
    .filter(flag => query[flag] === '1' || query[flag] === 'true')
}

/** Mount once in the Pro shell to consume success flags added by auth flows. */
export function useProEngagementToasts() {
  if (!import.meta.client)
    return

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const consumed = useState<EngagementFlag[]>('pro-engagement-toasts', () => [])

  watch(() => route.query, (query) => {
    const flags = activeEngagementFlags(query)
      .filter(flag => !consumed.value.includes(flag))
    if (!flags.length)
      return

    for (const flag of flags) {
      consumed.value.push(flag)
      toast.add({ ...engagementNotices[flag], color: 'success' })
    }

    const nextQuery = { ...query }
    for (const flag of flags)
      delete nextQuery[flag]
    router.replace({ query: nextQuery })
  }, { immediate: true })
}
