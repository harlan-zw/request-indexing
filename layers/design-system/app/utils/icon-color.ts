export type IconColor
  = | 'neutral'
    | 'primary'
    | 'pro'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'red'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'green'
    | 'emerald'
    | 'teal'
    | 'blue'
    | 'cyan'
    | 'sky'
    | 'lime'
    | 'pink'
    | 'rose'
    | 'gray'
    | 'slate'

const ICON_COLOR_MAP: Record<IconColor, { bg: string, text: string }> = {
  neutral: { bg: 'bg-accented', text: 'text-muted' },
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  pro: { bg: 'bg-pro/10', text: 'text-pro' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  error: { bg: 'bg-error/10', text: 'text-error' },
  info: { bg: 'bg-info/10', text: 'text-info' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-500' },
  // No indigo / violet / purple: DESIGN.md's Verdant palette has no purple in
  // it, so a caller asking for one used to paint a chip off-brand. `lime` is
  // the warm green that replaced it in the data-viz ramp.
  lime: { bg: 'bg-lime-500/10', text: 'text-lime-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
  // 'gray' is a semantic alias for 'neutral': raw `gray-*` Tailwind utilities
  // render Tailwind's stock cold gray, not the app's warm-slate neutral ramp
  // (global.css re-derives `--color-slate-*`, not `--color-gray-*`), so this
  // reuses the same semantic tokens as 'neutral' rather than the raw hue.
  gray: { bg: 'bg-accented', text: 'text-muted' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-500' },
}

export function getIconColor(color: IconColor | string | null | undefined): { bg: string, text: string } {
  if (!color)
    return ICON_COLOR_MAP.neutral
  return ICON_COLOR_MAP[color as IconColor] ?? ICON_COLOR_MAP.neutral
}
