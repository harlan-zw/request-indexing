<script lang="ts" setup generic="T extends Record<string, any>[], I extends T[0]">
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair } from '@unovis/vue'

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

const { columns, value } = toRefs(props)

const colorMode = useColorMode()

const chart = ref(null)
const container = ref(null)
const tooltipData = ref<MouseEventParams | null>(null)

const darkTheme = {
  chart: {
    layout: {
      background: {
        type: 'solid',
        color: 'transparent',
      },
      lineColor: '#2B2B43',
      textColor: '#D9D9D9',
    },
    watermark: {
      color: 'rgba(0, 0, 0, 0)',
    },
    crosshair: {
      color: '#758696',
    },
    grid: {
      vertLines: {
        visible: props.labels,
      },
      horzLines: {
        visible: props.labels,
      },
    },
  },
  series: {
    topColor: 'rgba(32, 226, 47, 0.56)',
    bottomColor: 'rgba(32, 226, 47, 0.04)',
    lineColor: 'rgba(32, 226, 47, 1)',
  },
  series2: {
    topColor: 'rgba(156, 39, 176, 0.4)',
    bottomColor: 'rgba(156, 39, 176, 0.04)',
    lineColor: 'rgba(156, 39, 176, 0.5)',
  },
  series3: {
    topColor: 'rgba(255, 152, 0, 0.3)',
    bottomColor: 'rgba(255, 152, 0, 0.04)',
    lineColor: 'rgba(255, 152, 0, 0.4)',
  },
}

const lightTheme = {
  chart: {
    layout: {
      background: {
        type: 'solid',
        color: 'transparent',
      },
      lineColor: '#2B2B43',
      textColor: '#191919',
    },
    watermark: {
      color: 'rgba(0, 0, 0, 0)',
    },
    grid: {
      vertLines: {
        visible: props.labels,
      },
      horzLines: {
        visible: props.labels,
      },
    },
  },
  series: {
    topColor: 'rgba(33, 150, 243, 0.9)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 0.5)',
  },
  // this is the impressions from google search console, we want to use a similar purple
  series2: {
    topColor: 'rgba(156, 39, 176, 0.3)',
    bottomColor: 'rgba(156, 39, 176, 0.04)',
    lineColor: 'rgba(156, 39, 176, 0.4)',
  },
  series3: {
    topColor: 'rgba(255, 152, 0, 0.3)',
    bottomColor: 'rgba(255, 152, 0, 0.04)',
    lineColor: 'rgba(255, 152, 0, 0.4)',
  },
}

const themesData = {
  Dark: darkTheme,
  Light: lightTheme,
}

onMounted(() => {
})

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
    } else {
      return (d: I) => d[col.key]
    }
  })
})
</script>

<template>
<VisXYContainer width="315" height="100" :data="value">
<!--  <div v-show="tooltipData?.time" class="absolute -bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm">-->
<!--    {{ $dayjs(tooltipData?.time).format('MMMM D, YYYY') }}-->
<!--  </div>-->
  <VisLine curve-type="linear"  :data="value" :x="(d, i) => i" :y="y[1]" />
  <VisArea :minHeight1Px="true"  color="#19cb9a" curve-type="basis" :x="(d, i) => i" :y="y[0]" />
  <VisCrosshair />
</VisXYContainer>
</template>
