// Stub: depends on `indexingInvestigations` table not yet lifted into this
// monorepo's schema. Skips the work cleanly until the schema lands.

export default defineTask({
  meta: {
    name: 'pro:resolve-investigations',
    description: 'Auto-resolve investigations — stub pending indexingInvestigations schema',
  },
  async run() {
    return { result: 'noop' }
  },
})
