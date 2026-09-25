<script setup lang="ts">
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption, LegendComponentOption } from 'echarts/components'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type EChartsOption = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption>

interface WeeklyBlock {
  start_time: string
  max_temp: string | null
  avg_temp: string | null
  min_temp: string | null
}

const props = withDefaults(defineProps<{
  rows: WeeklyBlock[]
  unit?: string
}>(), {
  unit: '°C'
})

// Average is the headline series; max/min ride along as a shaded range band in
// the same hue (an area fill "wash"), not as competing lines of their own.
const COLOR_AVG = '#006194'

function toNumber(value: string | null): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatBlockLabel(iso: string): string {
  const date = new Date(iso)
  const md = `${date.getMonth() + 1}/${date.getDate()}`
  const weekday = date.toLocaleDateString('zh-TW', { weekday: 'short' })
  const isDaytime = date.getHours() >= 6 && date.getHours() < 18
  return `${md} ${weekday}\n${isDaytime ? '白天' : '晚上'}`
}

const categories = computed(() => props.rows.map(r => formatBlockLabel(r.start_time)))
const avgSeries = computed(() => props.rows.map(r => toNumber(r.avg_temp)))
const minSeries = computed(() => props.rows.map(r => toNumber(r.min_temp)))
// Stacked on top of `minSeries` (which is drawn invisible), this reproduces the
// max value at the top of the fill without a second visible line.
const rangeSeries = computed(() => props.rows.map((r) => {
  const min = toNumber(r.min_temp)
  const max = toNumber(r.max_temp)
  return min == null || max == null ? null : +(max - min).toFixed(1)
}))

function tooltipFormatter(params: unknown): string {
  const p = Array.isArray(params) ? params[0] : params
  const index = (p as { dataIndex: number }).dataIndex
  const row = props.rows[index]
  if (!row) return ''

  const label = categories.value[index].replace('\n', ' ')
  const max = toNumber(row.max_temp)
  const avg = toNumber(row.avg_temp)
  const min = toNumber(row.min_temp)

  // Icon mirrors the actual chart marks: the 平均溫度 line's points are a
  // hollow ring (white fill, colored border — see itemStyle below), the
  // 溫度範圍 band is a solid translucent swatch, like its legend square.
  const row_ = (icon: string, name: string, value: number | null) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:4px;">
      <span style="display:flex;align-items:center;gap:6px;color:#3f4850;font-size:12px;">
        ${icon}${name}
      </span>
      <strong style="color:#131b2e;font-size:13px;">${value == null ? '--' : `${value}${props.unit}`}</strong>
    </div>`

  const squareIcon = `<span style="width:8px;height:8px;border-radius:2px;background:rgba(0,97,148,0.3);"></span>`
  const ringIcon = `<span style="width:8px;height:8px;border-radius:50%;background:#fff;border:2px solid ${COLOR_AVG};box-sizing:border-box;"></span>`
  return `
    <div style="font-size:12px;color:#3f4850;">${label}</div>
    ${row_(squareIcon, '最高溫度', max)}
    ${row_(ringIcon, '平均溫度', avg)}
    ${row_(squareIcon, '最低溫度', min)}
  `
}

const option = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: 'Inter, "Noto Sans TC", sans-serif' },
  grid: { left: 36, right: 16, top: 40, bottom: 40, containLabel: true },
  legend: {
    top: 0,
    left: 0,
    data: [
      { name: '平均溫度', icon: 'line', itemStyle: { color: COLOR_AVG }, lineStyle: { color: COLOR_AVG } },
      { name: '溫度範圍', icon: 'roundRect', itemStyle: { color: COLOR_AVG, opacity: 0.3 } }
    ],
    itemWidth: 14,
    itemHeight: 8,
    textStyle: { color: '#3f4850', fontSize: 12 }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: { color: '#bfc7d2' } },
    formatter: tooltipFormatter
  },
  xAxis: {
    type: 'category',
    data: categories.value,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#bfc7d2' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#3f4850',
      fontSize: 11,
      lineHeight: 16,
      // Label only the daytime block of each day — one short date per day,
      // always in the same position, instead of letting auto-thinning pick an
      // arbitrary (and sometimes always-nighttime) alternating set on narrow
      // screens. The weekday/白天/晚上 detail still lives in the tooltip.
      interval: 0,
      formatter: (_value: string, index: number) => {
        const row = props.rows[index]
        if (!row) return ''
        const date = new Date(row.start_time)
        const isDaytime = date.getHours() >= 6 && date.getHours() < 18
        return isDaytime ? `${date.getMonth() + 1}/${date.getDate()}` : ''
      }
    }
  },
  yAxis: {
    type: 'value',
    // Pad 2° past the week's actual high/low on each side — pure headroom for
    // a gentler-looking curve, not a change to the underlying values.
    min: (value: { min: number }) => Math.floor(value.min - 2),
    max: (value: { max: number }) => Math.ceil(value.max + 2),
    splitNumber: 6,
    axisLabel: { color: '#3f4850', fontSize: 11, formatter: '{value}°' },
    splitLine: { lineStyle: { color: '#e1e0d9' } }
  },
  series: [
    {
      name: '最低溫度',
      type: 'line',
      data: minSeries.value,
      stack: 'range',
      connectNulls: true,
      smooth: true,
      symbol: 'none',
      lineStyle: { opacity: 0 },
      tooltip: { show: false }
    },
    {
      name: '溫度範圍',
      type: 'line',
      data: rangeSeries.value,
      stack: 'range',
      connectNulls: true,
      smooth: true,
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { color: COLOR_AVG },
      areaStyle: { color: COLOR_AVG, opacity: 0.12 },
      tooltip: { show: false }
    },
    {
      name: '平均溫度',
      type: 'line',
      data: avgSeries.value,
      connectNulls: true,
      smooth: true,
      symbolSize: 8,
      lineStyle: { width: 2, color: COLOR_AVG },
      itemStyle: { color: COLOR_AVG, borderWidth: 2, borderColor: '#ffffff' }
    }
  ]
}))
</script>

<template>
  <VChart class="w-full h-96" :option="option" autoresize />
</template>
