<script setup lang="ts">
import type { WeeklyRow } from '~/composables/useLocationWeather'

const props = defineProps<{ rows: WeeklyRow[] }>()

const { toDisplay } = useTemperatureUnit()

const days = computed(() => groupWeeklyByDay(props.rows))

// Bars share one scale across the whole week, so a hotter day visibly sits further right.
const scale = computed(() => {
  const lows = days.value.map(d => d.min).filter((v): v is number => v != null)
  const highs = days.value.map(d => d.max).filter((v): v is number => v != null)
  if (!lows.length || !highs.length) return null
  const min = Math.min(...lows) - 2
  const max = Math.max(...highs) + 2
  return { min, span: Math.max(1, max - min) }
})

function barStyle(day: { min: number | null, max: number | null }) {
  const s = scale.value
  if (!s || day.min == null || day.max == null) return { display: 'none' }
  return {
    left: `${((day.min - s.min) / s.span) * 100}%`,
    right: `${100 - ((day.max - s.min) / s.span) * 100}%`
  }
}
</script>

<template>
  <section class="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg md:p-space-xl shadow-sm flex flex-col gap-space-lg">
    <div class="flex items-center justify-between gap-space-sm">
      <div class="flex items-center gap-space-xs">
        <span class="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">一週氣溫趨勢</h3>
      </div>
      <span class="font-label-sm text-label-sm text-outline">降雨機率 / 低溫 – 高溫</span>
    </div>

    <div v-if="days.length" class="flex flex-col gap-space-md">
      <div
        v-for="(day, index) in days"
        :key="day.date"
        class="flex items-center gap-space-sm font-body-sm text-body-sm"
      >
        <span class="w-9 shrink-0" :class="index === 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'">{{ day.label }}</span>
        <span class="material-symbols-outlined text-[18px] text-secondary shrink-0">{{ day.icon }}</span>
        <span
          class="w-11 shrink-0 inline-flex items-center gap-0.5 font-label-md text-label-md"
          :class="(day.pop ?? 0) >= 30 ? 'text-primary font-bold' : 'text-outline'"
          :title="`降雨機率 ${day.pop ?? '--'}%`"
        >
          <span class="material-symbols-outlined text-[12px]">water_drop</span>{{ day.pop ?? '--' }}%
        </span>
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <span class="text-outline font-label-md text-label-md w-7 text-right shrink-0">{{ toDisplay(day.min) }}°</span>
          <div class="flex-1 bg-surface-container-low h-2.5 rounded-full relative overflow-hidden">
            <div class="absolute h-full rounded-full bg-gradient-to-r from-secondary-container to-primary" :style="barStyle(day)" />
          </div>
          <span class="text-on-surface font-semibold font-label-md text-label-md w-7 shrink-0">{{ toDisplay(day.max) }}°</span>
        </div>
      </div>
    </div>
    <p v-else class="font-body-sm text-body-sm text-outline">目前沒有一週預報資料</p>
  </section>
</template>
