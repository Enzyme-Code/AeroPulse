<script setup lang="ts">
import type { HourlyRow } from '~/composables/useLocationWeather'

const props = defineProps<{ hours: HourlyRow[] }>()

const { formatTemp } = useTemperatureUnit()

function formatHour(iso: string, index: number): string {
  if (index === 0) return '現在'
  const date = new Date(iso)
  const hours = date.getHours()
  const period = hours < 12 ? 'AM' : 'PM'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${display} ${period}`
}

// A visible native scrollbar isn't guaranteed (varies by OS/browser scrollbar
// settings), so a mouse with no horizontal scroll input still needs a way to
// move the hourly cards — hence the explicit prev/next buttons below.
const scrollEl = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState() {
  const el = scrollEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollBy(direction: 1 | -1) {
  scrollEl.value?.scrollBy({ left: direction * 240, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})
onUnmounted(() => window.removeEventListener('resize', updateScrollState))
watch(() => props.hours, () => nextTick(updateScrollState))
</script>

<template>
  <section class="flex flex-col gap-space-lg bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg md:p-space-xl shadow-sm">
    <div class="flex items-center justify-between gap-space-sm">
      <div class="flex items-center gap-space-xs">
        <span class="material-symbols-outlined text-primary text-[20px]">schedule</span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">今日預報 (24小時趨勢)</h3>
      </div>
      <div class="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-secondary" />
        <span>氣溫變化與降雨機率預估</span>
      </div>
    </div>

    <div class="relative">
      <button
        v-if="canScrollLeft"
        type="button"
        aria-label="上一批時段"
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container-low"
        @click="scrollBy(-1)"
      >
        <span class="material-symbols-outlined text-xl">chevron_left</span>
      </button>
      <div
        ref="scrollEl"
        class="flex items-stretch gap-space-md overflow-x-auto pb-space-xs pt-1 no-scrollbar"
        @scroll="updateScrollState"
      >
        <div
          v-for="(hour, index) in hours"
          :key="hour.data_time"
          class="flex flex-col items-center justify-between min-w-[84px] px-space-sm py-space-md gap-space-xs rounded-xl text-center"
          :class="index === 0
            ? 'bg-secondary-fixed text-on-secondary-fixed shadow-sm'
            : 'bg-surface-container-low hover:bg-surface-container-high transition-transform hover:-translate-y-0.5'"
        >
          <span
            class="font-label-md text-label-md"
            :class="index === 0 ? 'font-semibold text-primary' : 'text-on-surface-variant'"
          >
            {{ formatHour(hour.data_time, index) }}
          </span>
          <span
            class="material-symbols-outlined text-[24px]"
            :class="index === 0 ? 'text-primary' : 'text-secondary'"
          >
            {{ weatherIcon(hour.wx_text, new Date(hour.data_time)) }}
          </span>
          <span class="font-title-sm text-title-sm" :class="index === 0 ? 'font-bold' : 'text-on-surface font-semibold'">
            {{ formatTemp(hour.temp) }}
          </span>
          <div
            class="flex items-center gap-0.5 text-[10px]"
            :class="index === 0 || Number(hour.pop) > 0 ? 'text-primary font-bold' : 'text-outline'"
          >
            <span class="material-symbols-outlined text-[12px]">water_drop</span>
            <span>{{ hour.pop ?? '--' }}%</span>
          </div>
        </div>
      </div>
      <button
        v-if="canScrollRight"
        type="button"
        aria-label="下一批時段"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container-low"
        @click="scrollBy(1)"
      >
        <span class="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>
  </section>
</template>
