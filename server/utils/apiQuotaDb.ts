export async function useUserIndexingApiQuota(userId: string) {
  const d = new Date()
  d.setHours(d.getHours() - 7)
  const date = d.toISOString().split('T')[0]
  const storage = userAppStorage<number>(userId, `quota:${date}`)
  let _value = await storage.getItem('quota') || 0
  return {
    value: _value,
    increment: async () => {
      _value++
      await storage.setItem('quota', _value)
      return _value
    },
    storage,
  }
}
