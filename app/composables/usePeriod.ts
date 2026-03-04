import type { Period } from '~/composables/useGscdump'

const STORAGE_KEY = 'ri:analyticsPeriod'

export function useDashboardPeriod() {
  const period = useState<Period>('dashboardPeriod', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['7d', '28d', '3m', '6m', '12m'].includes(stored))
        return stored as Period
    }
    return '28d'
  })

  function setPeriod(newPeriod: Period) {
    period.value = newPeriod
    if (import.meta.client)
      localStorage.setItem(STORAGE_KEY, newPeriod)
  }

  const periodLabel = computed(() => {
    const labels: Record<Period, string> = {
      '7d': 'Last 7 days',
      '28d': 'Last 28 days',
      '3m': 'Last 3 months',
      '6m': 'Last 6 months',
      '12m': 'Last 12 months',
    }
    return labels[period.value]
  })

  return { period, setPeriod, periodLabel }
}
