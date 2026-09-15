<script setup lang="ts">
import type { UiIcon } from '../../shared/ui-icons'
import { UIcon } from '#components'

/**
 * UiIcon — the icon primitive. A thin, typed wrapper over Nuxt UI's `<UIcon>`.
 *
 * The `name` is a curated semantic role (`refresh`, `next`, `delete`, …) or an
 * explicitly sourced `i-*` id. Roles resolve to the active set's icon via @nuxt/icon's global aliases
 * (registered in the design-system nuxt.config from the registry), so this component
 * passes `name` straight through — no runtime registry, nothing extra shipped to the
 * client. The `UiIcon` type keeps role autocomplete; type-only import is erased at build.
 *
 * The brand-kit set comparison calls `resolveUiIcon(role, set)` and feeds the
 * resulting whitelisted id back through this primitive.
 */
const { name } = defineProps<{ name?: UiIcon }>()
</script>

<template>
  <UIcon :name="name" />
</template>
