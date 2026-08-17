<script lang="ts" setup generic="I extends Record<string, unknown>">
import type { ChartOptions, DeepPartial, ISeriesApi, MouseEventParams, SeriesType, Time, UTCTimestamp } from 'lightweight-charts'
import { format } from 'date-fns'
import { AreaSeries, ColorType, createChart, LineSeries, LineType } from 'lightweight-charts'

type ColumnKey = Extract<keyof I, string>
type Column = ColumnKey | { key: ColumnKey, type: 'area' | 'line' }
type ChartSeries = ISeriesApi<'Area'> | ISeriesApi<'Line'>

const props = defineProps<{
  value: I[]
  columns?: Column[]
  colors?: Partial<Record<ColumnKey, string>>
  height?: number | string
  labels?: boolean
}>()

const emits = defineEmits<{
  tooltip: [data: MouseEventParams | null]
}>()

function fmtTooltipDate(time: Time | undefined) {
  if (time === undefined)
    return ''
  if (typeof time === 'object')
    return format(new Date(time.year, time.month - 1, time.day), 'MMMM d, yyyy')
  return format(new Date(time), 'MMMM d, yyyy')
}

function toChartTime(row: I): Time {
  const time = row.time ?? row.date
  if (typeof time === 'number')
    return time as UTCTimestamp
  if (typeof time === 'string')
    return time
  if (time instanceof Date)
    return time.toISOString().slice(0, 10)
  throw new TypeError('Each chart row requires a string, number, or Date time value.')
}

function toSeriesData(key: ColumnKey, rows: I[]) {
  return rows.map(row => ({
    time: toChartTime(row),
    value: Number(row[key]) || 0,
  }))
}

const colorMode = useColorMode()

const chart = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const tooltipData = ref<MouseEventParams | null>(null)

const darkTheme = {
  chart: {
    layout: {
      background: {
        type: ColorType.Solid,
        color: 'transparent',
      },
      textColor: '#D9D9D9',
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
} satisfies { chart: DeepPartial<ChartOptions>, series: AreaPalette, series2: AreaPalette, series3: AreaPalette }

const lightTheme = {
  chart: {
    layout: {
      background: {
        type: ColorType.Solid,
        color: 'transparent',
      },
      textColor: '#191919',
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
} satisfies { chart: DeepPartial<ChartOptions>, series: AreaPalette, series2: AreaPalette, series3: AreaPalette }

interface AreaPalette {
  topColor: string
  bottomColor: string
  lineColor: string
}

const themesData = {
  Dark: darkTheme,
  Light: lightTheme,
} satisfies Record<'Dark' | 'Light', { chart: DeepPartial<ChartOptions> }>

const palettes = [lightTheme.series, lightTheme.series2, lightTheme.series3]

/**
 * Series legend. The chart draws a blue and a purple line with nothing naming
 * them, so the reader cannot tell which metric is which. Colours here mirror
 * the order `addSeries` assigns palettes in.
 */
const legend = computed(() => (props.columns ?? []).map((col, index) => {
  const key = typeof col === 'string' ? col : col.key
  return {
    key,
    label: metricLabel(key),
    color: props.colors?.[key] ?? palettes[index % palettes.length]!.lineColor,
  }
}))

onMounted(() => {
  if (!chart.value)
    return

  const chartApi = createChart(chart.value, {
    height: Number(props.height) || 100,
    autoSize: true,
    rightPriceScale: {
      visible: props.labels,
    },
    timeScale: {
      visible: props.labels,
    },
    crosshair: {
      horzLine: {
        visible: props.labels,
      },
      vertLine: {
        visible: props.labels,
      },
    },
  })
  const series = new Map<ColumnKey, ChartSeries>()

  function removeSeries(key: ColumnKey) {
    const existing = series.get(key)
    if (!existing)
      return
    chartApi.removeSeries(existing as ISeriesApi<SeriesType>)
    series.delete(key)
  }

  function addSeries(col: Column) {
    const key = typeof col === 'string' ? col : col.key
    if (series.has(key))
      return
    const customColor = props.colors?.[key]
    const palette = palettes[series.size % palettes.length]!
    let nextSeries: ChartSeries
    if ((typeof col === 'object' ? col.type : 'area') === 'area') {
      nextSeries = chartApi.addSeries(AreaSeries, {
        ...palette,
        ...(customColor ? { topColor: customColor, bottomColor: 'transparent', lineColor: customColor } : {}),
        lineWidth: 2,
        priceLineVisible: props.labels,
        lastValueVisible: props.labels,
        priceScaleId: 'right',
        priceFormat: {
          type: 'volume',
        },
        lineType: LineType.WithSteps,
      })
    }
    else {
      nextSeries = chartApi.addSeries(LineSeries, {
        color: customColor ?? palette.lineColor,
        lineWidth: 4,
        priceLineVisible: props.labels,
        lastValueVisible: props.labels,
        priceScaleId: 'right',
        priceFormat: {
          type: 'volume',
        },
        lineType: LineType.WithSteps,
      })
    }
    nextSeries.setData(toSeriesData(key, props.value))
    series.set(key, nextSeries)
  }

  watch(() => props.columns ?? [], (newColumns, previousColumns) => {
    const newKeys = new Set(newColumns.map(col => typeof col === 'string' ? col : col.key))
    previousColumns?.forEach((col) => {
      const key = typeof col === 'string' ? col : col.key
      if (!newKeys.has(key))
        removeSeries(key)
    })
    newColumns.forEach(addSeries)
  }, {
    deep: true,
    immediate: true,
  })
  watch(() => props.value, (data) => {
    ;(props.columns ?? []).forEach((col) => {
      const key = typeof col === 'string' ? col : col.key
      series.get(key)?.setData(toSeriesData(key, data))
    })
    chartApi.timeScale().fitContent()
  }, { deep: true })
  chartApi.timeScale().fitContent()

  chartApi.subscribeCrosshairMove((param) => {
    const _container = container.value
    if (!_container)
      return
    if (
      param.point === undefined
      || !param.time
      || param.point.x < 0
      || param.point.x > _container.clientWidth
      || param.point.y < 0
      || param.point.y > _container.clientHeight
    ) {
      tooltipData.value = null
    }
    else {
      tooltipData.value = param
    }
  })

  function syncToTheme(theme: keyof typeof themesData) {
    chartApi.applyOptions(themesData[theme].chart)
  }

  syncToTheme(colorMode.value === 'dark' ? 'Dark' : 'Light')
  watch(() => colorMode.value, (newValue) => {
    syncToTheme(newValue === 'dark' ? 'Dark' : 'Light')
  })

  onBeforeUnmount(() => chartApi.remove())
})

watch(tooltipData, (val) => {
  emits('tooltip', val)
})

const containerHovered = useElementHover(container)
watch(containerHovered, (val) => {
  if (!val)
    tooltipData.value = null
})
</script>

<template>
  <div class="w-full">
    <ul v-if="legend.length" class="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
      <li v-for="series in legend" :key="series.key" class="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: series.color }" aria-hidden="true" />
        {{ series.label }}
      </li>
    </ul>
    <div ref="container" class="w-full relative bg-green-50/20" :style="{ height: `${height}px` }">
      <div v-show="tooltipData?.time" class="absolute -bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm">
        {{ fmtTooltipDate(tooltipData?.time) }}
      </div>
      <div ref="chart" />
    </div>
  </div>
</template>
