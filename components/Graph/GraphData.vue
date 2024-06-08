<script lang="ts" setup generic="T extends Record<string, any>[], I extends T[0]">
import { type MouseEventParams, createChart } from 'lightweight-charts'

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
  const _chart = createChart(chart.value!, {
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
  const series = {}
  // props.columns!.forEach((col, i) => {
  //   series[col] = series[col] || _chart.addAreaSeries({
  //     ...(typeof props.colors?.[col] !== 'undefined' ? props.colors[col] : lightTheme[`series${i}`]),
  //     lineWidth: 2,
  //     priceLineVisible: false,
  //     lastValueVisible: false,
  //     priceScaleId: 'right',
  //     priceFormat: {
  //       type: 'volume',
  //     },
  //     lineType: 1,
  //   })
  // })
  watch(columns, (newVal, prevVal) => {
    ;(prevVal || [])
      .filter(col => !newVal.includes(col))
      .forEach((col) => {
        if (series[col]) {
          _chart.removeSeries(series[col])
          delete series[col]
        }
      })
    ;(newVal || []).forEach((col) => {
      const key = typeof col === 'string' ? col : col.key
      if (series[key])
        return
      if ((typeof col === 'object' ? col.type : 'area') === 'area') {
        series[key] = _chart.addAreaSeries({
          // @ts-expect-error untyped
          ...(typeof props.colors?.[key] !== 'undefined' ? props.colors[key] : lightTheme[`series${Object.keys(series).length + 1}`]),
          lineWidth: 2,
          priceLineVisible: props.labels,
          lastValueVisible: props.labels,
          priceScaleId: 'right',
          priceFormat: {
            type: 'volume',
          },
          lineType: 1,
        })
      }
      else {
        series[key] = _chart.addLineSeries({
          // @ts-expect-error untyped
          ...(typeof props.colors?.[key] !== 'undefined' ? props.colors[key] : lightTheme[`series${Object.keys(series).length + 1}`]),
          lineWidth: 5,
          priceLineVisible: props.labels,
          lastValueVisible: props.labels,
          priceScaleId: 'right',
          lineStyle: 1,
          priceFormat: {
            type: 'volume',
          },
          lineType: 1,
          ...col,
        })
      }
      series[key].setData((value.value || []).map(d => ({
        time: d.time || d.date,
        value: Number(d[key]) || 0,
      })))
    })
  }, {
    deep: true,
    immediate: true,
  })
  watch(value, (data) => {
    props.columns!.forEach((col) => {
      const key = typeof col === 'string' ? col : col.key
      series[key].setData(data.map(d => ({
        time: d.time || d.date,
        value: Number(d[key]) || 0,
      })))
      _chart.timeScale().fitContent()
    })
  })
  _chart.timeScale().fitContent()

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
      tooltipData.value = null
    }
    else {
      tooltipData.value = param
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
  emits('tooltip', val)
})

const containerHovered = useElementHover(container)
watch(containerHovered, (val) => {
  if (!val)
    tooltipData.value = null
})
</script>

<template>
  <div ref="container" class="w-full relative bg-green-50/20" :style="{ height: `${height}px` }">
    <div v-show="tooltipData?.time" class="absolute -bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm">
      {{ $dayjs(tooltipData?.time).format('MMMM D, YYYY') }}
    </div>
    <div ref="chart" />
  </div>
</template>
