import type { IssueSeverity } from '#layers/pro-indexing/app/utils/indexing-issues'
import { useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'

export interface IndexingIssueRow {
  type: string
  label: string
  severity: IssueSeverity
  count: number
  description: string
  fix: string
}

export function useIndexingPrompt() {
  const { site, gscdumpSiteId } = useSite()
  const gscdump = useProGscdump()
  const toast = useToast()

  const generatingPromptFor = ref<string>()
  const promptModalOpen = ref(false)
  const promptModalContent = ref('')
  const promptModalTitle = ref('')

  async function generatePrompt(row: IndexingIssueRow) {
    generatingPromptFor.value = row.type
    const siteUrl = site.value?.url || site.value?.name || ''
    const sId = gscdumpSiteId.value
    const urlData = sId
      ? await gscdump.listSiteIndexingUrls({
          params: { siteId: sId },
          query: { limit: 50, issue: row.type },
        }, true).catch(() => null)
      : null

    const urlList = urlData?.urls?.map(u => u.url).join('\n') || '(Could not fetch URLs)'

    promptModalContent.value = `I have a ${row.severity}-level indexing issue on my website${siteUrl ? ` (${siteUrl})` : ''}.

## Issue: ${row.label}
**${row.count} URLs affected**

### What Google reports
${row.description}

### Recommended fix
${row.fix}

### Affected URLs
${urlList}

---

Please analyze these URLs and provide:
1. The most likely root cause for this issue on my site
2. Step-by-step instructions to fix it
3. How to verify the fix is working
4. Any preventive measures to avoid this issue recurring`

    promptModalTitle.value = row.label
    generatingPromptFor.value = undefined
    promptModalOpen.value = true
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(promptModalContent.value)
    toast.add({
      title: 'Prompt copied to clipboard',
      description: 'Paste into any AI assistant.',
      icon: 'i-lucide-clipboard-check',
      color: 'success',
    })
  }

  return {
    generatingPromptFor,
    promptModalOpen,
    promptModalContent,
    promptModalTitle,
    generatePrompt,
    copyPrompt,
  }
}
