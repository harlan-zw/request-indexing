// Ported from nuxtseo.com's `layers/saas/app/composables/useProCommandPalette.ts`.
// One open state, so the sidebar trigger and the Cmd/Ctrl+K shortcut drive the
// same palette.
export function useProCommandPalette() {
  const open = useState('pro-command-palette-open', () => false)
  return {
    open,
    openPalette: () => { open.value = true },
    closePalette: () => { open.value = false },
  }
}
