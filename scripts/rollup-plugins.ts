function containsNamedPlugin(entry: unknown, name: string): boolean {
  if (Array.isArray(entry))
    return entry.some(plugin => containsNamedPlugin(plugin, name))

  return typeof entry === 'object'
    && entry !== null
    && 'name' in entry
    && entry.name === name
}

export function withoutRollupPlugin<T>(plugins: T[], name: string): T[] {
  return plugins.filter(plugin => !containsNamedPlugin(plugin, name))
}
