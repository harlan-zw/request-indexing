<script lang="ts" setup>
import { AreaSeries, ColorType, createChart } from 'lightweight-charts'

interface ChartPoint {
  time: string
  value: number
}

interface SearchConsoleSeries {
  clicks: ChartPoint[]
  impressions: ChartPoint[]
  ctr: ChartPoint[]
  position: ChartPoint[]
}

const props = defineProps<{
  value: SearchConsoleSeries
  charts: ('clicks' | 'impressions' | 'ctr' | 'position')[]
  height?: number | string
}>()

const emits = defineEmits<{
  tooltip: [data: { clicks: number, impressions: number, ctr: number, position: number, time: string } | null]
}>()

const colorMode = useColorMode()

const chart = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)

const tooltipData = ref({
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
  time: '',
})

const darkTheme = {
  chart: {
    layout: {
      background: {
        type: ColorType.Solid,
        color: 'transparent',
      },
      lineColor: '#2B2B43',
      textColor: '#D9D9D9',
    },
    watermark: {
      color: 'rgba(0, 0, 0, 0)',
    },
    grid: {
      vertLines: {
        visible: false,
      },
      horzLines: {
        visible: false,
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
} as const

const lightTheme = {
  chart: {
    layout: {
      background: {
        type: ColorType.Solid,
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
        visible: false,
      },
      horzLines: {
        visible: false,
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
} as const

const themesData = {
  Dark: darkTheme,
  Light: lightTheme,
} as const

onMounted(() => {
  const _chart = createChart(chart.value!, {
    height: Number(props.height) || 100,
    autoSize: true,
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      visible: false,
    },
    crosshair: {
      horzLine: {
        visible: false,
      },
      vertLine: {
        visible: false,
      },
    },
  })
  _chart.timeScale().fitContent()

  props.charts.forEach((chart) => {
    switch (chart) {
      case 'clicks':
        _chart.addSeries(AreaSeries, {
          topColor: 'rgba(33, 150, 243, 0.56)',
          bottomColor: 'rgba(33, 150, 243, 0.04)',
          lineColor: 'rgba(33, 150, 243, 1)',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
          priceFormat: {
            type: 'volume',
          },
          lineType: 2,
        }).setData(props.value.clicks)
        break
      case 'impressions':
        _chart.addSeries(AreaSeries, {
          topColor: 'rgba(156, 39, 176, 0.3)',
          bottomColor: 'rgba(156, 39, 176, 0.04)',
          lineColor: 'rgba(156, 39, 176, 0.4)',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
          priceFormat: {
            type: 'volume',
          },
          lineType: 2,
        }).setData(props.value.impressions)
        break
      case 'position':
        // position uses an orange colour
        _chart.addSeries(AreaSeries, {
          topColor: 'rgba(255, 152, 0, 0.3)',
          bottomColor: 'rgba(255, 152, 0, 0.04)',
          lineColor: 'rgba(255, 152, 0, 0.4)',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
          priceFormat: {
            type: 'volume',
          },
          lineType: 2,
        }).setData(props.value.position)
        break
      case 'ctr':
        _chart.addSeries(AreaSeries, {
          topColor: 'rgba(0, 137, 123, 0.3)',
          bottomColor: 'rgba(0, 137, 123, 0.04)',
          lineColor: 'rgba(0, 137, 123, 0.4)',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
          priceFormat: { type: 'percent' },
          lineType: 2,
        }).setData(props.value.ctr)
        break
    }
  })

  _chart.subscribeCrosshairMove((param) => {
    const _container = container.value!
    if (
      param.point === undefined
      || typeof param.time !== 'string'
      || param.point.x < 0
      || param.point.x > _container.clientWidth
      || param.point.y < 0
      || param.point.y > _container.clientHeight
    ) {
      tooltipData.value = {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        time: '',
      }
    }
    else {
      // time will be in the same format that we supplied to setData.
      // thus it will be YYYY-MM-DD
      const dateStr = param.time
      const clicks = props.value.clicks.find(d => d.time === dateStr)?.value ?? 0
      const impressions = props.value.impressions.find(d => d.time === dateStr)?.value ?? 0
      const position = props.value.position.find(d => d.time === dateStr)?.value ?? 0
      const ctr = props.value.ctr.find(d => d.time === dateStr)?.value ?? 0
      tooltipData.value = {
        clicks,
        impressions,
        ctr,
        position,
        time: dateStr,
      }
      // toolTip.style.display = 'block'
      // const _clicks = param.seriesData.get(areaSeries)!
      // const clicks = _clicks.value !== undefined ? _clicks.value : _clicks.time
      // const _impressions = param.seriesData.get(areaSeries2)
      // const impressions = _impressions?.value !== undefined ? _impressions?.value : _impressions?.time
      //
      // tooltipData.value = {
      //   clicks,
      //   impressions,
      //   time: dateStr,
      // }
    }
  })

  function syncToTheme(theme: keyof typeof themesData) {
    _chart.applyOptions(themesData[theme].chart)
    // areaSeries.applyOptions(themesData[theme].series)
    // areaSeries2.applyOptions(themesData[theme].series2)
  }

  syncToTheme(colorMode.value === 'dark' ? 'Dark' : 'Light')
  watch(colorMode, (newVal) => {
    syncToTheme(newVal.value === 'dark' ? 'Dark' : 'Light')
  })
})

watch(tooltipData, (val) => {
  emits('tooltip', val?.time === '' ? null : val)
})

const containerHovered = useElementHover(container)
watch(containerHovered, (val) => {
  if (!val) {
    tooltipData.value = {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      time: '',
    }
  }
})
</script>

<template>
  <div ref="container" class="w-full h-full">
    <div ref="chart" />
  </div>
</template>
