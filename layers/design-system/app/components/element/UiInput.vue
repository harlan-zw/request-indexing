<script setup lang="ts" generic="T extends InputValue = InputValue">
import type { InputEmits, InputProps, InputValue } from '@nuxt/ui'
import { UInput } from '#components'

/**
 * UiInput — thin wrapper around Nuxt UI v4's UInput.
 *
 * Tokens (radius, ring, background) are already centralized in
 * `app.config.ts`'s `ui.input` — this component isn't a re-theme, it's the
 * single legal entry point for `<input>`-style fields (raw `<UInput>` is
 * ESLint-banned via `eslint/selectors.ts`) so a future behavioral change
 * lands in one file instead of another repo-wide sweep. Every prop, emit,
 * and slot passes straight through unchanged.
 */

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()
const emit = defineEmits<Omit<InputEmits<T>, 'update:modelValue'>>()
type Props = Omit<InputProps<T>, 'modelValue' | 'defaultValue' | 'modelModifiers'>
const modelValue = defineModel<T>()
</script>

<template>
  <UInput
    v-bind="{ ...props, ...$attrs }"
    v-model="modelValue"
    @blur="emit('blur', $event)"
    @change="emit('change', $event)"
  >
    <template v-for="(_, name) in ($slots as Record<string, unknown>)" #[name]="slotProps" :key="name">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </UInput>
</template>
