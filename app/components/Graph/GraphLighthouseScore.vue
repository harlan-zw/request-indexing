<script lang="ts" setup>
import { createChart } from 'lightweight-charts'
import { useHumanMs } from '~/composables/formatting'

const props = defineProps<{
  value?: { time: string, value: number }[]
  height?: number | string
}>()

const colorMode = useColorMode()

const chart = ref(null)
const container = ref(null)

const tooltipData = ref({
  value: 0,
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

  const areaSeries = _chart.addBaselineSeries({
    topColor: 'rgba(33, 150, 243, 0.56)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 1)',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    priceScaleId: 'right',
    baseValue: { type: 'price', price: 90 },
    // bottomLineColor: 'rgba( 12, 206, 106, 1)',
    // bottomFillColor1: 'rgba( 12, 206, 106, 0.28)',
    // bottomFillColor2: 'rgba( 12, 206, 106, 0.05)',
    // topLineColor: 'rgba( 255, 164, 0, 1)',
    // topFillColor1: 'rgba( 255, 164, 0, 0.05)',
    // topFillColor2: 'rgba( 255, 164, 0, 0.28)',
    topLineColor: 'rgba( 12, 206, 106, 1)',
    topFillColor1: 'rgba( 12, 206, 106, 0.28)',
    topFillColor2: 'rgba( 12, 206, 106, 0.05)',
    bottomLineColor: 'rgba( 255, 164, 0, 1)',
    bottomFillColor1: 'rgba( 255, 164, 0, 0.05)',
    bottomFillColor2: 'rgba( 255, 164, 0, 0.28)',
    priceFormat: {
      type: 'volume',
    },
    lineType: 2,
  })
  if (props.value && props.value.length) {
    // Good (≤ 2.5 s)
    // Needs Improvement (2.5 s - 4 s)
    // Poor (> 4 s)

    areaSeries.setData(props.value.map(({ time, value }) => {
      if (value < 50) {
        return {
          time,
          value,
          bottomLineColor: 'rgba( 255, 78, 67, 1)',
          bottomFillColor1: 'rgba( 255, 78, 67, 0.05)',
          bottomFillColor2: 'rgba( 255, 78, 67, 0.28)',
        }
      }
      return { time, value }
    }))
  }

  _chart.subscribeCrosshairMove((param) => {
    const _container = container.value!
    if (!_container) {
      return
    }
    if (
      param.point === undefined
      || !param.time
      || param.point.x < 0
      || param.point.x > _container.clientWidth
      || param.point.y < 0
      || param.point.y > _container.clientHeight
    ) {
      tooltipData.value = {
        value: 0,
        time: '',
      }
    }
    else {
      // time will be in the same format that we supplied to setData.
      // thus it will be YYYY-MM-DD
      const dayjs = useDayjs()
      const dateStr = dayjs(param.time).format('MMM D, YYYY')
      // toolTip.style.display = 'block'
      tooltipData.value = {
        value: param.seriesData.get(areaSeries)?.value || 0,
        time: dateStr,
      }
    }
  })

  function syncToTheme(theme) {
    _chart.applyOptions(themesData[theme].chart)
    areaSeries.applyOptions(themesData[theme].series)
  }

  syncToTheme(colorMode.value === 'dark' ? 'Dark' : 'Light')
  watch(colorMode, (newVal) => {
    syncToTheme(newVal.value === 'dark' ? 'Dark' : 'Light')
  })
})
</script>

<template>
  <div ref="container" class="w-full h-full">
    <div ref="chart" />
    <div class="tooltip">
      <div v-if="tooltipData.time" class="dark:text-gray-200 text-gray-600 text-xs">
        <div class="dark:text-gray-400 text-gray-500 text-xs ">
          {{ tooltipData.time }}
        </div>
        <div class="font-bold" :class="tooltipData.value >= moderate ? 'text-red-500' : tooltipData.value >= fast ? 'text-yellow-500' : 'text-green-500'">
          {{ useHumanMs(tooltipData.value) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  text-align: center;
  position: absolute;
  padding: 4px;
  z-index: 20;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
</style>
