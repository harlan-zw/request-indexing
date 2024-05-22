<script lang="ts" setup>
import { createChart } from 'lightweight-charts'

const props = defineProps<{
  value: { totalPagesCount: { time: string, value: number }[], indexedPagesCount: { time: string, value: number }[], indexedPercent: { time: string, value: number }[] }
  charts: ('totalPagesCount' | 'indexedPagesCount' | 'indexedPercent')[]
  height?: number | string
}>()

const emits = defineEmits<{
  tooltip: [data: { totalPagesCount: number, indexedPagesCount: number, indexedPercent: number, time: string } | null]
}>()

const colorMode = useColorMode()

const chart = ref(null)
const container = ref(null)

const tooltipData = ref({
  totalPagesCount: 0,
  indexedPagesCount: 0,
  indexedPercent: 0,
  time: '',
})

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
}

const themesData = {
  Dark: darkTheme,
  Light: lightTheme,
}

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
  let totalPagesCountChart: ReturnType<typeof _chart.addAreaSeries>
  let indexedPagesCount: ReturnType<typeof _chart.addAreaSeries>
  let indexedPercent: ReturnType<typeof _chart.addAreaSeries>
  watch(() => props.value, (charts) => {
    console.log('updating chats value', charts)
    Object.entries(charts).forEach(([chart, data]) => {
      switch (chart) {
        case 'totalPagesCount':
          totalPagesCountChart = totalPagesCountChart || _chart.addAreaSeries({
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
          })
          totalPagesCountChart.setData(data)
          console.log('added totalPagesCount', data)
          break
        case 'indexedPagesCount':
          indexedPagesCount = indexedPagesCount || _chart.addAreaSeries({
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
          })
          indexedPagesCount.setData(data)
          break
        case 'indexedPercent':
          // position uses an orange colour
          indexedPercent = indexedPercent || _chart.addAreaSeries({
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
          })
          indexedPercent.setData(data)
          break
      }
    })
  })

  _chart.subscribeCrosshairMove((param) => {
    const _container = container.value!
    if (
      param.point === undefined
      || !param.time
      || param.point.x < 0
      || param.point.x > _container.clientWidth
      || param.point.y < 0
      || param.point.y > _container.clientHeight
    ) {
      tooltipData.value = {
        totalPagesCount: 0,
        indexedPagesCount: 0,
        indexedPercent: 0,
        time: '',
      }
    }
    else {
      // time will be in the same format that we supplied to setData.
      // thus it will be YYYY-MM-DD
      const dateStr = param.time
      const totalPagesCount = props.value.totalPagesCount.find(d => d.time === dateStr).value
      const indexedPagesCount = props.value.indexedPagesCount.find(d => d.time === dateStr).value
      const indexedPercent = props.value.indexedPercent.find(d => d.time === dateStr).value
      tooltipData.value = {
        totalPagesCount,
        indexedPagesCount,
        indexedPercent,
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

  function syncToTheme(theme) {
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
      totalPagesCount: 0,
      indexedPagesCount: 0,
      indexedPercent: 0,
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
