import type { AdminCtx, AdminListQuery } from '../admin-shell'
import { defineAdminResource } from '../admin-shell'

interface WaitlistRow {
  id: string
  email: string
  status: string
  createdAt: string
  tags: string[]
}

interface Contact {
  id: string
  email_address: string
  status: string
  created_at: string
  tags: Record<string, boolean> | string[] | { tag: string }[]
}
interface ApiResponse { data: Contact[], paging: { next: string | null } }

function extractTags(tags: Contact['tags']): string[] {
  if (!tags)
    return []
  if (Array.isArray(tags))
    return tags.map(t => typeof t === 'string' ? t : t.tag).filter(Boolean)
  return Object.keys(tags)
}

async function fetchWaitlist(event: AdminCtx['event']): Promise<WaitlistRow[]> {
  const config = useRuntimeConfig(event)
  const listId = '6c462a3a-91b1-11ef-bd09-15cf0f9f3feb'

  const allContacts: Contact[] = []
  let nextUrl: string | null = `https://emailoctopus.com/api/1.6/lists/${listId}/contacts?api_key=${config.emailOctopusToken}&limit=100`

  while (nextUrl) {
    const response: ApiResponse | null = await $fetch<ApiResponse>(nextUrl).catch(() => null)
    if (!response?.data?.length)
      break
    allContacts.push(...response.data)
    nextUrl = response.paging?.next ? `https://emailoctopus.com${response.paging.next}` : null
  }

  return allContacts
    .filter((c) => {
      const tags = extractTags(c.tags)
      return !tags.includes('Paid')
    })
    .map(contact => ({
      id: contact.id,
      email: contact.email_address,
      status: contact.status,
      createdAt: contact.created_at,
      tags: extractTags(contact.tags),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default defineAdminResource<WaitlistRow>({
  key: 'waitlist',
  label: 'Waitlist',
  singular: 'Waitlist contact',
  icon: 'i-lucide-clock',
  group: 'System',
  perPage: 50,
  fields: [
    { type: 'text', key: 'id', label: 'ID' },
    { type: 'text', key: 'email', label: 'Email', searchable: true },
    { type: 'badge', key: 'status', label: 'Status', badgeMap: { subscribed: 'success', unsubscribed: 'neutral', pending: 'warning' } },
    { type: 'datetime', key: 'createdAt', label: 'Signed up' },
    { type: 'json', key: 'tags', label: 'Tags' },
  ],
  cards: [
    {
      key: 'total',
      type: 'metric',
      label: 'Total waitlist',
      load: async ({ event }) => {
        const all = await fetchWaitlist(event)
        return { value: all.length }
      },
    },
  ],
  index: async ({ event }: AdminCtx, q: AdminListQuery) => {
    const page = q.page ?? 1
    const perPage = q.perPage ?? 50
    const offset = (page - 1) * perPage
    let all = await fetchWaitlist(event)
    if (q.search) {
      const needle = q.search.toLowerCase()
      all = all.filter(r => r.email.toLowerCase().includes(needle))
    }
    const rows = all.slice(offset, offset + perPage)
    return { rows, total: all.length }
  },
})
