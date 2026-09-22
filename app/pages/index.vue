<script setup lang="ts">
interface ThirtySixHourBlock {
  county_name: string
  start_time: string
  end_time: string
  wx_text: string | null
  pop: number | null
  min_temp: number | null
  max_temp: number | null
  ci_text: string | null
  weather_description: string | null
}

interface OverviewPollutionRow {
  country: string
  aqi: number | null
}

const router = useRouter()
const { cities, ensureCitiesLoaded } = useCitySelection()
const config = useRuntimeConfig()

usePageSeo({
  title: 'AeroPulse | 台灣即時天氣與空氣品質總覽',
  description: '掌握全台各縣市即時天氣預報、36小時天氣概況與空氣品質(AQI)資訊,點選縣市即可查看鄉鎮的詳細溫度、降雨機率與空品狀態。'
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AeroPulse',
      url: config.public.siteUrl
    })
  }]
})

function viewCountyDetail(county: string) {
  const matches = cities.value.filter(c => c.county_name === county)
  const match = matches[Math.floor(Math.random() * matches.length)]
  if (match) {
    router.push(`/weather/${encodeURIComponent(match.county_name)}/${encodeURIComponent(match.township_name)}`)
  }
}

onMounted(ensureCitiesLoaded)

const overviewBlocks = ref<ThirtySixHourBlock[]>([])
const overviewPollution = ref<OverviewPollutionRow[]>([])
const overviewLoading = ref(true)

async function loadOverview() {
  overviewLoading.value = true

  const [blocks, pollutionRows] = await Promise.all([
    $fetch<ThirtySixHourBlock[]>('/api/weather/36hour'),
    $fetch<OverviewPollutionRow[]>('/api/air/pollution')
  ])

  overviewBlocks.value = blocks
  overviewPollution.value = pollutionRows
  overviewLoading.value = false
}

const overviewAqiByCounty = computed(() => {
  const grouped = new Map<string, number[]>()
  for (const row of overviewPollution.value) {
    if (row.aqi == null) continue
    const list = grouped.get(row.country) ?? []
    list.push(row.aqi)
    grouped.set(row.country, list)
  }

  const averages = new Map<string, number>()
  for (const [county, values] of grouped) {
    averages.set(county, Math.round(values.reduce((sum, v) => sum + v, 0) / values.length))
  }
  return averages
})

const overviewRows = computed(() => {
  const grouped = new Map<string, ThirtySixHourBlock[]>()
  for (const row of overviewBlocks.value) {
    const list = grouped.get(row.county_name) ?? []
    list.push(row)
    grouped.set(row.county_name, list)
  }
  return Array.from(grouped.entries()).map(([county, rows]) => ({
    county,
    block: currentBlock(rows),
    aqi: overviewAqiByCounty.value.get(county) ?? null
  }))
})

onMounted(loadOverview)
</script>

<template>
  <div>
    <LoadingState v-if="overviewLoading" message="正在載入天氣總覽..." />

    <!-- Overview: every county's current conditions, no location needed -->
    <section v-else class="glass-card rounded-xl p-6">

      <!-- Card list (mobile) -->
      <div class="grid grid-cols-1 gap-3 md:hidden">
        <div
          v-for="row in overviewRows"
          :key="row.county"
          class="glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors"
          @click="viewCountyDetail(row.county)"
        >
          <span class="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary text-xl">{{ weatherIcon(row.block?.wx_text ?? null) }}</span>
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-body-md text-body-md text-on-surface font-bold whitespace-nowrap">{{ row.county }}</span>
              <span class="font-body-md text-body-md text-on-surface whitespace-nowrap">{{ row.block?.min_temp ?? '--' }}°C - {{ row.block?.max_temp ?? '--' }}°C</span>
            </div>
            <div class="mt-1">
              <span class="font-body-md text-body-md text-on-surface-variant whitespace-nowrap">{{ row.block?.wx_text ?? '--' }}</span>
            </div>
            <div class="flex items-center justify-between gap-2 mt-1">
              <span class="flex items-center gap-1 text-primary font-label-sm text-label-sm font-bold whitespace-nowrap">
                <span class="material-symbols-outlined text-sm">water_drop</span>
                降雨機率 {{ row.block?.pop ?? '--' }}%
              </span>
              <span
                class="font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                :style="{ backgroundColor: aqiColor(row.aqi) + '1f', color: aqiColor(row.aqi) }"
              >
                <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: aqiColor(row.aqi) }" />
                AQI: {{ row.aqi ?? '--' }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="overviewRows.length === 0" class="glass-card rounded-xl p-6 text-center text-on-surface-variant">
          目前沒有資料
        </div>
      </div>

      <!-- Table (desktop) -->
      <div class="overflow-x-auto hidden md:block">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low">
              <th class="py-3 px-4 font-normal rounded-l-lg">縣市</th>
              <th class="py-3 px-4 font-normal">天氣</th>
              <th class="py-3 px-4 font-normal">溫度</th>
              <th class="py-3 px-4 font-normal">降雨機率</th>
              <th class="py-3 px-4 font-normal rounded-r-lg">空氣品質</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in overviewRows"
              :key="row.county"
              class="border-b border-outline-variant/10 last:border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              @click="viewCountyDetail(row.county)"
            >
              <td class="py-3 px-4 font-body-md text-body-md text-on-surface font-bold whitespace-nowrap">{{ row.county }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-lg">{{ weatherIcon(row.block?.wx_text ?? null) }}</span>
                  </span>
                  <span class="font-body-md text-body-md text-on-surface-variant whitespace-nowrap">{{ row.block?.wx_text ?? '--' }}</span>
                </div>
              </td>
              <td class="py-3 px-4 font-body-md text-body-md text-on-surface whitespace-nowrap">
                {{ row.block?.min_temp ?? '--' }}°C - {{ row.block?.max_temp ?? '--' }}°C
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold whitespace-nowrap">
                  <span class="material-symbols-outlined text-sm">water_drop</span>
                  {{ row.block?.pop ?? '--' }}%
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap"
                  :style="{ backgroundColor: aqiColor(row.aqi) + '1f', color: aqiColor(row.aqi) }"
                >
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: aqiColor(row.aqi) }" />
                  AQI: {{ row.aqi ?? '--' }}
                </span>
              </td>
            </tr>
            <tr v-if="overviewRows.length === 0">
              <td colspan="5" class="py-6 text-center text-on-surface-variant">目前沒有資料</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
