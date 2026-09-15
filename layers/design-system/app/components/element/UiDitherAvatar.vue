<script setup lang="ts">
import { computed, useId } from 'vue'

const { seed, size = 32, label } = defineProps<{
  seed: string
  size?: number
  label?: string
}>()

/*
 * Beam generator adapted from Boring Avatars:
 * https://github.com/boringdesigners/boring-avatars
 *
 * MIT License
 *
 * Copyright (c) 2021 boringdesigners
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const SIZE = 36
const AVATAR_COLORS = ['#8B5CF6', '#00DC82', '#F59E0B', '#EC4899', '#3B82F6'] as const

function hashCode(name: string): number {
  let hash = 0
  for (let index = 0; index < name.length; index++) {
    const character = name.charCodeAt(index)
    hash = ((hash << 5) - hash) + character
    hash &= hash
  }
  return Math.abs(hash)
}

function getDigit(number: number, position: number): number {
  return Math.floor((number / 10 ** position) % 10)
}

function getBoolean(number: number, position: number): boolean {
  return getDigit(number, position) % 2 === 0
}

function getUnit(number: number, range: number, position?: number): number {
  const value = number % range
  return position && getDigit(number, position) % 2 === 0 ? -value : value
}

function getRandomColor(number: number, colors: readonly string[]): string {
  return colors[number % colors.length]!
}

function getContrast(hexColor: string): string {
  const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor
  const red = Number.parseInt(color.slice(0, 2), 16)
  const green = Number.parseInt(color.slice(2, 4), 16)
  const blue = Number.parseInt(color.slice(4, 6), 16)
  const yiq = (red * 299 + green * 587 + blue * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

function generateBeamData(name: string, colors: readonly string[]) {
  const number = hashCode(name)
  const wrapperColor = getRandomColor(number, colors)
  const preTranslateX = getUnit(number, 10, 1)
  const wrapperTranslateX = preTranslateX < 5 ? preTranslateX + SIZE / 9 : preTranslateX
  const preTranslateY = getUnit(number, 10, 2)
  const wrapperTranslateY = preTranslateY < 5 ? preTranslateY + SIZE / 9 : preTranslateY

  return {
    wrapperColor,
    faceColor: getContrast(wrapperColor),
    backgroundColor: getRandomColor(number + 13, colors),
    wrapperTranslateX,
    wrapperTranslateY,
    wrapperRotate: getUnit(number, 360),
    wrapperScale: 1 + getUnit(number, SIZE / 12) / 10,
    isMouthOpen: getBoolean(number, 2),
    isCircle: getBoolean(number, 1),
    eyeSpread: getUnit(number, 5),
    mouthSpread: getUnit(number, 3),
    faceRotate: getUnit(number, 10, 3),
    faceTranslateX: wrapperTranslateX > SIZE / 6 ? wrapperTranslateX / 2 : getUnit(number, 8, 1),
    faceTranslateY: wrapperTranslateY > SIZE / 6 ? wrapperTranslateY / 2 : getUnit(number, 7, 2),
  }
}

const data = computed(() => generateBeamData(seed, AVATAR_COLORS))
const id = useId().replace(/[^a-z0-9]/gi, '')
const maskId = `avatar-mask-${id}`
const ditherId = `avatar-dither-${id}`
const wrapperTransform = computed(() => [
  `translate(${data.value.wrapperTranslateX} ${data.value.wrapperTranslateY})`,
  `rotate(${data.value.wrapperRotate} ${SIZE / 2} ${SIZE / 2})`,
  `scale(${data.value.wrapperScale})`,
].join(' '))
const faceTransform = computed(() => [
  `translate(${data.value.faceTranslateX} ${data.value.faceTranslateY})`,
  `rotate(${data.value.faceRotate} ${SIZE / 2} ${SIZE / 2})`,
].join(' '))
</script>

<template>
  <span
    class="ui-dither-avatar inline-flex shrink-0 overflow-hidden rounded-full"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <svg viewBox="0 0 36 36" fill="none" class="size-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
          <rect width="36" height="36" rx="72" fill="white" />
        </mask>
        <pattern :id="ditherId" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.55" :fill="data.faceColor" opacity="0.2" />
          <circle cx="2.8" cy="2.8" r="0.4" :fill="data.faceColor" opacity="0.12" />
        </pattern>
      </defs>

      <g :mask="`url(#${maskId})`">
        <rect width="36" height="36" :fill="data.backgroundColor" />
        <rect
          width="36"
          height="36"
          :transform="wrapperTransform"
          :fill="data.wrapperColor"
          :rx="data.isCircle ? 36 : 6"
        />
        <g :transform="faceTransform">
          <path
            v-if="data.isMouthOpen"
            :d="`M15 ${19 + data.mouthSpread}c2 1 4 1 6 0`"
            :stroke="data.faceColor"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else
            :d="`M13,${19 + data.mouthSpread} a1,0.75 0 0,0 10,0`"
            :fill="data.faceColor"
          />
          <rect :x="14 - data.eyeSpread" y="14" width="1.5" height="2" rx="1" :fill="data.faceColor" />
          <rect :x="20 + data.eyeSpread" y="14" width="1.5" height="2" rx="1" :fill="data.faceColor" />
        </g>
        <rect width="36" height="36" :fill="`url(#${ditherId})`" />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.ui-dither-avatar {
  background: var(--ui-bg-elevated);
}
</style>
