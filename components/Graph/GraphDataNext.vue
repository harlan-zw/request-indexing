<script lang="ts" setup generic="T extends Record<string, any>[], I extends T[0]">
import { VisArea, VisCrosshair, VisLine, VisXYContainer } from '@unovis/vue'

const props = defineProps<{
  value: T
  columns?: (keyof I | { key: keyof I, type: 'area' | 'line' })[]
  colors?: Record<keyof I, string>
  height?: number | string
  labels?: boolean
}>()

const emits = defineEmits<{
  tooltip: [data: MouseEventParams | null]
}>()

const { value } = toRefs(props)

const container = ref(null)
const tooltipData = ref<MouseEventParams | null>(null)

watch(tooltipData, (val) => {
  emits('tooltip', val)
})

const containerHovered = useElementHover(container)
watch(containerHovered, (val) => {
  if (!val)
    tooltipData.value = null
})

const y = computed(() => {
  return props.columns?.map((col) => {
    if (typeof col === 'string') {
      return (d: I) => d[col]
    }
    else {
      return (d: I) => d[col.key]
    }
  })
})
</script>

<template>
  <VisXYContainer width="315" height="100" :data="value">
    <!--  <div v-show="tooltipData?.time" class="absolute -bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm"> -->
    <!--    {{ $dayjs(tooltipData?.time).format('MMMM D, YYYY') }} -->
    <!--  </div> -->
    <VisLine curve-type="linear" :data="value" :x="(d, i) => i" :y="y[1]" />
    <VisArea :min-height1-px="true" color="#19cb9a" curve-type="basis" :x="(d, i) => i" :y="y[0]" />
    <VisCrosshair />
  </VisXYContainer>
</template>
