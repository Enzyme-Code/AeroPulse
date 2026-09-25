<script setup lang="ts">
import type { Region } from '~/composables/useCountyOverview'

// `limit` gives the compact home-dashboard version (a handful of rows + a link to
// /overview); omit it for the full 22-county list.
const props = defineProps<{
  limit?: number
  highlightCounty?: string
  highlightTownship?: string
}>()

const router = useRouter()
const { cities, ensureCitiesLoaded } = useCitySelection()
const { rows, loading, lastUpdated, ensureLoaded, refresh } = useCountyOverview()

useAutoRefresh(refresh, lastUpdated)
const updatedAgo = useUpdatedAgo(lastUpdated)
const { formatTemp, toDisplay, unitLabel } = useTemperatureUnit()

const region = ref<Region | '全部'>('全部')

const visibleRows = computed(() => {
  const filtered = region.value === '全部' ? rows.value : rows.value.filter(r => r.region === region.value)
  // The viewed county goes first so the compact table always includes it.
  const sorted = props.highlightCounty
    ? [...filtered].sort((a, b) => Number(b.county === props.highlightCounty) - Number(a.county === props.highlightCounty))
    : filtered
  return props.limit ? sorted.slice(0, props.limit) : sorted
})

function viewCountyDetail(county: string) {
  if (county === props.highlightCounty && props.highlightTownship) {
    router.push(`/weather/${encodeURIComponent(county)}/${encodeURIComponent(props.highlightTownship)}`)
    return
  }
  const matches = cities.value.filter(c => c.county_name === county)
  const match = matches[Math.floor(Math.random() * matches.length)]
  if (match) {
    router.push(`/weather/${encodeURIComponent(match.county_name)}/${encodeURIComponent(match.township_name)}`)
  }
}

function popClass(pop: number | null | undefined) {
  if (pop == null || pop === 0) return 'bg-surface-container-high text-outline'
  if (pop >= 40) return 'bg-secondary text-on-secondary font-bold shadow-sm'
  return 'bg-secondary-fixed text-primary font-bold'
}

onMounted(() => {
  ensureCitiesLoaded()
  ensureLoaded()
})
</script>

<template>
  <section class="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg md:p-space-xl shadow-sm flex flex-col justify-between">
    <div class="flex flex-col gap-space-lg">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[22px]">map</span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">全台主要縣市即時天氣</h3>
        </div>
        <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-full font-label-md text-label-md overflow-x-auto no-scrollbar max-w-full">
          <button
            v-for="option in ['全部', ...REGIONS]"
            :key="option"
            type="button"
            class="px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors"
            :class="region === option ? 'bg-secondary-fixed text-on-secondary-fixed font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
            @click="region = option as Region | '全部'"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <LoadingState v-if="loading" message="正在載入全台天氣..." class="!min-h-[240px] !shadow-none" />

      <template v-else>
        <!-- Card list (mobile) -->
        <div class="grid grid-cols-1 gap-space-md md:hidden">
          <div
            v-for="row in visibleRows"
            :key="row.county"
            class="rounded-xl bg-surface-container-low p-space-md flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors"
            @click="viewCountyDetail(row.county)"
          >
            <span class="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-secondary text-xl">{{ weatherIcon(row.block?.wx_text ?? null) }}</span>
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-title-sm text-title-sm text-on-surface whitespace-nowrap flex items-center gap-1">
                  <span v-if="row.county === highlightCounty" class="material-symbols-outlined text-primary text-[16px]">pin_drop</span>
                  {{ row.county }}
                </span>
                <span class="font-title-sm text-title-sm text-on-surface whitespace-nowrap">{{ toDisplay(row.block?.min_temp) }} - {{ formatTemp(row.block?.max_temp) }}</span>
              </div>
              <div class="flex items-center justify-between gap-2 mt-1">
                <span class="font-body-sm text-body-sm text-on-surface-variant truncate">{{ row.block?.wx_text ?? '--' }}</span>
                <div class="flex items-center gap-1 shrink-0">
                  <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px]" :class="popClass(row.block?.pop)">
                    <span class="material-symbols-outlined text-[13px]">water_drop</span>{{ row.block?.pop ?? '--' }}%
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm"
                    :style="{ backgroundColor: aqiColor(row.aqi) + '26', color: aqiColor(row.aqi) }"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: aqiColor(row.aqi) }" />AQI {{ row.aqi ?? '--' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p v-if="visibleRows.length === 0" class="py-6 text-center font-body-sm text-body-sm text-outline">目前沒有資料</p>
        </div>

        <!-- Table (desktop) -->
        <div class="w-full overflow-x-auto hidden md:block">
          <table class="w-full text-left">
            <thead>
              <tr class="text-outline font-label-md text-label-md">
                <th class="pb-3 px-space-sm font-semibold">縣市</th>
                <th class="pb-3 px-space-sm font-semibold">天氣現況</th>
                <th class="pb-3 px-space-sm font-semibold">今日氣溫</th>
                <th class="pb-3 px-space-sm font-semibold">降雨機率</th>
                <th class="pb-3 px-space-sm font-semibold text-right">空氣品質</th>
              </tr>
            </thead>
            <tbody class="font-body-sm text-body-sm">
              <tr
                v-for="row in visibleRows"
                :key="row.county"
                class="hover:bg-surface-container-low transition-colors cursor-pointer"
                @click="viewCountyDetail(row.county)"
              >
                <td class="py-3.5 px-space-sm font-title-sm text-title-sm text-on-surface whitespace-nowrap">
                  <span class="inline-flex items-center gap-1">
                    <span v-if="row.county === highlightCounty" class="material-symbols-outlined text-primary text-[16px]">pin_drop</span>
                    {{ row.county }}
                  </span>
                </td>
                <td class="py-3.5 px-space-sm text-on-surface-variant">
                  <span class="inline-flex items-center gap-1 whitespace-nowrap">
                    <span class="material-symbols-outlined text-secondary text-[16px]">{{ weatherIcon(row.block?.wx_text ?? null) }}</span>
                    {{ row.block?.wx_text ?? '--' }}
                  </span>
                </td>
                <td class="py-3.5 px-space-sm text-on-surface font-semibold whitespace-nowrap">
                  {{ toDisplay(row.block?.min_temp) }}{{ unitLabel }} - {{ formatTemp(row.block?.max_temp) }}
                </td>
                <td class="py-3.5 px-space-sm">
                  <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] whitespace-nowrap" :class="popClass(row.block?.pop)">
                    <span class="material-symbols-outlined text-[13px]">water_drop</span> {{ row.block?.pop ?? '--' }}%
                  </span>
                </td>
                <td class="py-3.5 px-space-sm text-right">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm whitespace-nowrap"
                    :style="{ backgroundColor: aqiColor(row.aqi) + '26', color: aqiColor(row.aqi) }"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: aqiColor(row.aqi) }" /> AQI {{ row.aqi ?? '--' }}
                  </span>
                </td>
              </tr>
              <tr v-if="visibleRows.length === 0">
                <td colspan="5" class="py-6 text-center text-outline">目前沒有資料</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <div v-if="limit" class="pt-space-md mt-space-sm flex items-center justify-between gap-space-sm">
      <span class="font-body-sm text-body-sm text-outline">
        共 {{ rows.length || '--' }} 個縣市監測資料<ClientOnly><template v-if="updatedAgo"> · {{ updatedAgo }}</template></ClientOnly>
      </span>
      <NuxtLink to="/overview" class="flex items-center gap-1 font-title-sm text-title-sm text-primary hover:underline">
        <span>查看全部縣市</span>
        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </NuxtLink>
    </div>
  </section>
</template>
