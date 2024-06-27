<script lang="ts" setup>
import { type SeriesMarker, createChart } from 'lightweight-charts'

const props = defineProps<{
  clicks?: { time: string, value: number }[]
  impressions?: { time: string, value: number }[]
  position?: { time: string, value: number }[]
  ctr?: { time: string, value: number }[]
  height?: number | string
}>()

const colorMode = useColorMode()

const chart = ref(null)
const container = ref(null)

const tooltipData = ref({
  clicks: 0,
  impressions: 0,
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
      visible: true,
    },
    leftPriceScale: {
      visible: true,
    },
    crosshair: {
      mode: 0, // CrosshairMode.Normal
    },
    // rightPriceScale: {
    //   visible: false,
    // },
    // timeScale: {
    //   visible: false,
    // },
    // crosshair: {
    //   horzLine: {
    //     visible: false,
    //   },
    //   vertLine: {
    //     visible: false,
    //   },
    // },
  })
  _chart.timeScale().fitContent()

  const coreUpdates = {
    '2023-11-08': 'November 2023 reviews update',
    '2023-11-02': 'November 2023 core update',
    '2023-10-05': 'October 2023 core update',
    '2023-10-04': 'October 2023 spam update',
    '2023-09-14': 'September 2023 helpful content update',
    '2023-08-22': 'August 2023 core update',
    '2023-04-12': 'April 2023 reviews update',
    '2023-03-15': 'March 2023 core update',
    '2023-02-21': 'February 2023 product reviews update',
  }
  const markers = props.impressions!.map((row) => {
    if (row.time in coreUpdates) {
      return {
        time: row.time,
        color: '#f68410',
        position: 'inBar',
        shape: 'circle',
        text: 'U',
      } satisfies SeriesMarker<string>
    }
    return false
  }).filter(Boolean) as SeriesMarker<string>[]

  const clicksSeries = _chart.addAreaSeries({
    topColor: 'rgba(33, 150, 243, 0.56)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 1)',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    priceFormat: {
      type: 'volume',
    },
    lineType: 2,
  })
  if (props.clicks && props.clicks.length)
    clicksSeries.setData(props.clicks)

  const impressionsSeries = _chart.addAreaSeries({
    topColor: 'rgba(33, 150, 243, 0.56)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 1)',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    priceFormat: {
      type: 'volume',
    },
    lineType: 2,
  })
  if (props.impressions && props.impressions.length) {
    impressionsSeries.setData(props.impressions)
    impressionsSeries.setMarkers(markers)
  }

  _chart.addLineSeries({
    color: 'rgba(232, 113, 10, 0.5)',
    lineWidth: 2,
    priceScaleId: 'left',
    priceFormat: {
      type: 'volume',
    },
    lineType: 2,
  }).setData(props.position || [])

  _chart.addLineSeries({
    color: 'rgba(0, 137, 123, 0.5)',
    lineWidth: 2,
    priceScaleId: 'left',
    priceFormat: {
      type: 'volume',
    },
    lineType: 2,
  }).setData(props.ctr || [])

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
        clicks: 0,
        impressions: 0,
        time: '',
      }
    }
    else {
      // time will be in the same format that we supplied to setData.
      // thus it will be YYYY-MM-DD
      const dateStr = param.time
      // toolTip.style.display = 'block'
      const _clicks = param.seriesData.get(clicksSeries)!
      const clicks = _clicks.value !== undefined ? _clicks.value : _clicks.time
      const _impressions = param.seriesData.get(impressionsSeries)
      const impressions = _impressions?.value !== undefined ? _impressions?.value : _impressions?.time

      tooltipData.value = {
        clicks,
        impressions,
        time: dateStr,
      }
    }
  })

  function syncToTheme(theme) {
    _chart.applyOptions(themesData[theme].chart)
    clicksSeries.applyOptions(themesData[theme].series)
    impressionsSeries.applyOptions(themesData[theme].series2)
  }

  syncToTheme(colorMode.value === 'dark' ? 'Dark' : 'Light')
  watch(colorMode, (newVal) => {
    syncToTheme(newVal.value === 'dark' ? 'Dark' : 'Light')
  })
})
</script>

<template>
  <div ref="container" class="w-full h-full relative">
    <div ref="chart" />
    <div class="tooltip">
      <div v-if="tooltipData.time" class="dark:text-gray-200 text-gray-600 text-lg">
        <div class="dark:text-gray-400 text-gray-500 text-lg font-bold ">
          {{ tooltipData.time }}
        </div>
        <div>Clicks {{ useHumanFriendlyNumber(tooltipData.clicks) }}</div>
        <div v-if="tooltipData.impressions">
          Impressions {{ useHumanFriendlyNumber(tooltipData.impressions) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  position: absolute;
  z-index: 20;
  top: 4px;
  left: 15px;
  pointer-events: none;
}
</style>
