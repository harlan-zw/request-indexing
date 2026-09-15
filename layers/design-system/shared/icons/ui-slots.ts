import type { ICON_ALIASES, IconRole } from './registry'

type SemanticUiIcon = IconRole | keyof typeof ICON_ALIASES

/**
 * Nuxt UI's complete icon-slot vocabulary, expressed only in design-system
 * roles. Keeping this in build-time app config prevents Nuxt UI from adding
 * its default Lucide set beside the curated client bundle.
 */
export const UI_ICON_SLOTS = {
  arrowDown: 'down',
  arrowLeft: 'back',
  arrowRight: 'next',
  arrowUp: 'up',
  caution: 'caution',
  check: 'check',
  chevronDoubleLeft: 'page-first',
  chevronDoubleRight: 'page-last',
  chevronDown: 'expand',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  chevronUp: 'collapse',
  close: 'close',
  copy: 'copy',
  copyCheck: 'success',
  dark: 'dark',
  document: 'file',
  drag: 'grip',
  ellipsis: 'more-horizontal',
  error: 'error',
  external: 'external',
  eye: 'view',
  eyeOff: 'hide',
  file: 'file',
  folder: 'folder',
  folderOpen: 'folder',
  hash: 'hash',
  info: 'info',
  light: 'light',
  loading: 'loading',
  menu: 'menu',
  minus: 'minus',
  next: 'next',
  note: 'note',
  panelClose: 'back',
  panelOpen: 'next',
  plus: 'add',
  prev: 'back',
  reload: 'refresh',
  search: 'search',
  stop: 'stop',
  star: 'star',
  success: 'success',
  system: 'system',
  tip: 'tip',
  upload: 'upload',
  warning: 'warning',
} as const satisfies Record<string, SemanticUiIcon>
