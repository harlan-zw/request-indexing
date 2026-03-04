---
name: nuxt-ui-skilld
description: "ALWAYS use when writing code importing \"@nuxt/ui\". Consult for debugging, best practices, or modifying @nuxt/ui, nuxt/ui, nuxt ui, ui."
metadata:
  version: 4.5.1
  generated_by: Claude Code · Haiku 4.5
  generated_at: 2026-03-04
---

# nuxt/ui `@nuxt/ui`

**Version:** 4.5.1 (Mar 2026)
**Deps:** @floating-ui/dom@^1.7.5, @iconify/vue@^5.0.0, @internationalized/date@^3.11.0, @internationalized/number@^3.6.5, @nuxt/fonts@^0.14.0, @nuxt/icon@^2.2.1, @nuxt/kit@^4.3.1, @nuxt/schema@^4.3.1, @nuxtjs/color-mode@^3.5.2, @standard-schema/spec@^1.1.0, @tailwindcss/postcss@^4.2.1, @tailwindcss/vite@^4.2.1, @tanstack/vue-table@^8.21.3, @tanstack/vue-virtual@^3.13.19, @tiptap/core@^3.20.0, @tiptap/extension-bubble-menu@^3.20.0, @tiptap/extension-code@^3.20.0, @tiptap/extension-collaboration@^3.20.0, @tiptap/extension-drag-handle@^3.20.0, @tiptap/extension-drag-handle-vue-3@^3.20.0, @tiptap/extension-floating-menu@^3.20.0, @tiptap/extension-horizontal-rule@^3.20.0, @tiptap/extension-image@^3.20.0, @tiptap/extension-mention@^3.20.0, @tiptap/extension-node-range@^3.20.0, @tiptap/extension-placeholder@^3.20.0, @tiptap/markdown@^3.20.0, @tiptap/pm@^3.20.0, @tiptap/starter-kit@^3.20.0, @tiptap/suggestion@^3.20.0, @tiptap/vue-3@^3.20.0, @unhead/vue@^2.1.10, @vueuse/core@^14.2.1, @vueuse/integrations@^14.2.1, @vueuse/shared@^14.2.1, colortranslator@^5.0.0, consola@^3.4.2, defu@^6.1.4, embla-carousel-auto-height@^8.6.0, embla-carousel-auto-scroll@^8.6.0, embla-carousel-autoplay@^8.6.0, embla-carousel-class-names@^8.6.0, embla-carousel-fade@^8.6.0, embla-carousel-vue@^8.6.0, embla-carousel-wheel-gestures@^8.1.0, fuse.js@^7.1.0, hookable@^5.5.3, knitwork@^1.3.0, magic-string@^0.30.21, mlly@^1.8.0, motion-v@^1.10.3, ohash@^2.0.11, pathe@^2.0.3, reka-ui@2.8.2, scule@^1.3.0, tailwind-merge@^3.5.0, tailwind-variants@^3.2.2, tailwindcss@^4.2.1, tinyglobby@^0.2.15, ufo@^1.6.3, unplugin@^3.0.0, unplugin-auto-import@^21.0.0, unplugin-vue-components@^31.0.0, vaul-vue@0.4.1, vue-component-type-helpers@^3.2.5
**Tags:** alpha: 4.0.0-alpha.2 (Sep 2025), beta: 4.0.0-beta.0 (Sep 2025), false: 3.3.7 (Oct 2025), latest: 4.5.1 (Mar 2026)

**References:** [package.json](./.skilld/pkg/package.json) — exports, entry points • [README](./.skilld/pkg/README.md) — setup, basic usage • [Docs](./.skilld/docs/_INDEX.md) — API reference, guides • [GitHub Issues](./.skilld/issues/_INDEX.md) — bugs, workarounds, edge cases • [Releases](./.skilld/releases/_INDEX.md) — changelog, breaking changes, new APIs

## Search

Use `skilld search` instead of grepping `.skilld/` directories — hybrid semantic + keyword search across all indexed docs, issues, and releases. If `skilld` is unavailable, use `npx -y skilld search`.

```bash
skilld search "query" -p @nuxt/ui
skilld search "issues:error handling" -p @nuxt/ui
skilld search "releases:deprecated" -p @nuxt/ui
```

Filters: `docs:`, `issues:`, `releases:` prefix narrows by source type.

## API Changes

This section documents version-specific API changes — prioritize recent major/minor releases.

### Breaking Changes

- BREAKING: `Theme` component — new in v4.5.0, use to override child component themes instead of individual `ui` props [source](./.skilld/releases/v4.5.0.md#art-new-theme-component)

- BREAKING: Exposed refs now return HTML elements directly instead of component instances — v4.2.0 change affects `InputMenu`, `InputNumber`, `InputTags`, `Select`, `SelectMenu`. Use `inputMenu.value.inputRef` instead of `inputMenu.value.inputRef.$el` [source](./.skilld/releases/v4.2.0.md:L51:62)

- BREAKING: `CommandPalette` — `trailing-icon` prop now for input only, use new `children-icon` prop for child items [source](./.skilld/releases/v4.1.0.md:L47:56)

- BREAKING: `Table` `@select` event — arguments reordered to `(event, row)` instead of `(row, event)` [source](./.skilld/releases/v4.1.0.md:L58:67)

- BREAKING: Composables import path — no longer need `.js` extension, use `import { useToast } from '@nuxt/ui/composables'` instead of `'@nuxt/ui/composables/useToast.js'` [source](./.skilld/releases/v4.2.0.md:L64:75)

- BREAKING: Vite plugin theme template path — update `tsconfig.node.json` alias from `./node_modules/@nuxt/ui/.nuxt/ui` to `./node_modules/.nuxt-ui/ui` [source](./.skilld/releases/v4.2.0.md:L77:94)

### New Components

- NEW: `Theme` component — provide component UI overrides to entire child tree via `inject`/`provide`, nested theming supported [source](./.skilld/releases/v4.5.0.md:L11:31)

- NEW: `Editor` component — TipTap-based rich text editor with JSON/HTML/Markdown support, supports extensions [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `EditorToolbar` component — customizable toolbar with formatting actions and link editing [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `EditorSuggestionMenu` component — command menu (`/`) for inserting blocks [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `EditorMentionMenu` component — mention menu (`@`) for referencing entities [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `EditorEmojiMenu` component — emoji picker (`:`) for inline emoji insertion [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `EditorDragHandle` component — drag handle to reorder blocks with dropdown menu [source](./.skilld/releases/v4.3.0.md:L11:26)

- NEW: `ScrollArea` component — flexible scroll container with built-in TanStack Virtual virtualization [source](./.skilld/releases/v4.3.0.md:L28:32)

- NEW: `InputDate` component — date input component using `CalendarDate` model [source](./.skilld/releases/v4.2.0.md:L11:26)

- NEW: `InputTime` component — time input component using `Time` model [source](./.skilld/releases/v4.2.0.md:L11:26)

- NEW: `Empty` component — display empty states when no content to show [source](./.skilld/releases/v4.1.0.md:L11:15)

### New Features & Props

- NEW: `virtualize` prop — enable virtualization for large datasets on `CommandPalette`, `InputMenu`, `SelectMenu`, `Table`, `Tree` [source](./.skilld/releases/v4.1.0.md:L17:24)

- NEW: Neutral colors — `taupe`, `mauve`, `mist`, `olive` now available, configure via `ui.neutral` in `app.config.ts` [source](./.skilld/releases/v4.5.0.md:L33:35)

- NEW: `Toaster` duplicate prevention — automatically prevents duplicate toasts with pulse animation [source](./.skilld/releases/v4.5.0.md:L37:41)

Also changed: `CommandPalette` input prop · `CommandPalette` size prop · `Calendar` weekNumbers prop · `Calendar` variant prop · `by` prop for Select/SelectMenu/InputMenu · `valueKey` prop for components · `clear` prop for InputMenu/SelectMenu · `Editor` placeholder.mode prop · `Editor` taskList handler · `Editor` size prop in menus · `Timeline` select event · `FormField` orientation prop · `InputMenu`/`Select`/`SelectMenu` modelModifiers prop · `Modal` scrollable prop · `FileUpload` preview prop · `theme.prefix` option · `experimental.componentDetection` option · `defineShortcuts` layoutIndependent option

## Best Practices

- Wrap your app with `UApp` to enable global configuration, toast/tooltip providers, and programmatic modal/slideover support — this is required for `useOverlay` and `useToast` to work [source](./.skilld/docs/content/docs/2.components/app.md)

- Use the `ui` prop to override component slots instead of repeating `class` props — it respects Tailwind Variants merging and compound variants, ensuring consistent precedence [source](./.skilld/docs/content/docs/1.getting-started/5.theme/3.components.md:L310:356)

- Use the `Theme` component to apply consistent styling across groups of child components — enables scoped theme overrides without modifying each component individually and nesting is supported with innermost taking precedence [source](./.skilld/docs/content/docs/2.components/theme.md)

- Define semantic colors in `@theme` CSS with the `--color-*` syntax rather than runtime config — makes themes portable and performant [source](./.skilld/docs/content/docs/1.getting-started/5.theme/1.design-system.md:L45:79)

- Use `Form` with Standard Schema (Valibot, Zod, Regle, Yup, Joi, Superstruct) for validation — pair with `FormField` and validation automatically propagates based on field `name` with dot notation support for nested objects [source](./.skilld/docs/content/docs/2.components/form.md:L10:79)

- Use nested `Form` components to validate complex form structures — nested forms inherit parent state and validating the parent automatically validates all children [source](./.skilld/docs/content/docs/2.components/form.md:L174:195)

- Use `useOverlay` with `overlay.create()` and shared composable pattern for programmatic modal/slideover management — enables awaiting overlay.open() to return user input via close event emission [source](./.skilld/docs/content/docs/3.composables/use-overlay.md:L6:28)

- Use `defineShortcuts` with `layoutIndependent: true` option for keyboard support across different keyboard layouts (Arabic, Hebrew) — defaults to character-based matching but physical key matching works consistently regardless of layout [source](./.skilld/docs/content/docs/3.composables/define-shortcuts.md:L53:57)

- Use `Table` component with `useVueTable` composable for type-safe data rendering — built on TanStack Table with flexible `columns`, `data`, `meta` props and `h()` function for custom cell rendering [source](./.skilld/docs/content/docs/2.components/table.md:L14:111)

- Configure semantic color aliases (`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`) in `app.config.ts` under `ui.colors` — ensures consistency and enables theme switching without component changes [source](./.skilld/docs/content/docs/1.getting-started/5.theme/1.design-system.md:L101:150)
