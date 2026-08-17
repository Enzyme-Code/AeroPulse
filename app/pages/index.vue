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

interface HourlyRow {
  geocode: string
  data_time: string
  wx_text: string | null
  pop: string | null
  temp: string | null
  dew_point: string | null
  humidity: string | null
  apparent_temp: string | null
  comfort_index: string | null
  wind_direction: string | null
  wind_speed: string | null
  weather_description: string | null
}

interface WeeklyRow {
  geocode: string
  start_time: string
  end_time: string
  uv_index: string | null
}

interface Station {
  siteid: number
  sitename: string
  country: string
}

interface Pollution {
  siteid: number
  sitename: string
  country: string
  aqi: number | null
  status: string | null
}

const { selectedCounty, selectedTownship, selectedGeocode, locatingByGps, ensureLocationResolved } = useCitySelection()

const viewMode = ref<'overview' | 'detail'>('overview')

const thirtySixHour = ref<ThirtySixHourBlock[]>([])
const hourly = ref<HourlyRow[]>([])
const weekly = ref<WeeklyRow[]>([])
const pollution = ref<Pollution | null>(null)
const loading = ref(true)

// Overview tab: every county's current 36-hour block + average AQI, no region selection needed.
const overviewBlocks = ref<ThirtySixHourBlock[]>([])
const overviewPollution = ref<Pollution[]>([])
const overviewLoading = ref(true)

async function loadOverview() {
  overviewLoading.value = true

  const [blocks, pollutionRows] = await Promise.all([
    $fetch<ThirtySixHourBlock[]>('/api/weather/36hour'),
    $fetch<Pollution[]>('/api/air/pollution')
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

async function loadDashboard() {
  if (!selectedCounty.value || !selectedGeocode.value) return

  loading.value = true

  const [b36, hourlyRows, weeklyRows, stations] = await Promise.all([
    $fetch<ThirtySixHourBlock[]>('/api/weather/36hour', { query: { county: selectedCounty.value } }),
    $fetch<HourlyRow[]>('/api/weather/forecast-three-days', { query: { geocode: selectedGeocode.value } }),
    $fetch<WeeklyRow[]>('/api/weather/forecast-one-week', { query: { geocode: selectedGeocode.value } }),
    $fetch<Station[]>('/api/air/stations', { query: { country: selectedCounty.value } })
  ])

  thirtySixHour.value = b36
  hourly.value = hourlyRows
  weekly.value = weeklyRows

  if (stations.length) {
    const rows = await $fetch<Pollution[]>('/api/air/pollution', { query: { siteId: stations[0].siteid } })
    pollution.value = rows[0] ?? null
  } else {
    pollution.value = null
  }

  loading.value = false
}

async function enterDetailView() {
  viewMode.value = 'detail'

  const previousGeocode = selectedGeocode.value
  await ensureLocationResolved()

  // If the geocode actually changed, the selectedGeocode watcher below already
  // triggers loadDashboard(); only call it here when nothing changed (e.g. a
  // location was already picked before switching tabs), so it isn't loaded twice.
  if (selectedGeocode.value === previousGeocode) {
    await loadDashboard()
  }
}

onMounted(loadOverview)

watch(selectedGeocode, () => {
  if (viewMode.value === 'detail') loadDashboard()
})

function currentBlock(rows: ThirtySixHourBlock[]): ThirtySixHourBlock | null {
  if (!rows.length) return null
  const now = Date.now()
  const active = rows.find(r => new Date(r.start_time).getTime() <= now && now < new Date(r.end_time).getTime())
  return active ?? closestByTime(rows, 'start_time')
}

// UV index is only published for one daytime block per day; nearby blocks can be null, so
// search among blocks that actually have a reading rather than whichever block covers "now".
function currentWeeklyBlock(rows: WeeklyRow[]): WeeklyRow | null {
  const withUv = rows.filter(r => r.uv_index != null)
  return closestByTime(withUv, 'start_time')
}

const heroBlock = computed(() => currentBlock(thirtySixHour.value))
const heroHour = computed(() => closestByTime(filledHourly.value, 'data_time'))
const heroUv = computed(() => currentWeeklyBlock(weekly.value))
const filledHourly = computed(() => fillForwardHourly(hourly.value))

const upcomingHours = computed(() => {
  const now = Date.now()
  return filledHourly.value.filter(r => new Date(r.data_time).getTime() >= now - 30 * 60 * 1000).slice(0, 8)
})

function formatHour(iso: string, index: number): string {
  if (index === 0) return '現在'
  const date = new Date(iso)
  const hours = date.getHours()
  const period = hours < 12 ? 'AM' : 'PM'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${display} ${period}`
}

const now = ref(new Date())
onMounted(() => {
  const timer = setInterval(() => { now.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(timer))
})

const formattedDate = computed(() => now.value.toLocaleDateString('zh-TW', {
  month: 'long', day: 'numeric', weekday: 'long'
}) + ' | ' + now.value.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' }))

const aqiProgressClass = computed(() => {
  const aqi = pollution.value?.aqi ?? 0
  if (aqi <= 50) return 'bg-green-400'
  if (aqi <= 100) return 'bg-yellow-400'
  if (aqi <= 150) return 'bg-orange-400'
  return 'bg-red-400'
})
</script>

<template>
  <div>
    <!-- View toggle -->
    <div class="inline-flex rounded-full bg-surface-container p-1 mb-2">
      <button
        class="px-4 py-2 rounded-full font-body-md text-body-md transition-colors"
        :class="viewMode === 'overview' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'"
        @click="viewMode = 'overview'"
      >
        總覽
      </button>
      <button
        class="px-4 py-2 rounded-full font-body-md text-body-md transition-colors"
        :class="viewMode === 'detail' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'"
        @click="enterDetailView"
      >
        詳細查詢
      </button>
    </div>

    <!-- Overview: every county's current conditions, no location needed -->
    <section v-if="viewMode === 'overview'" class="glass-card rounded-xl p-6">

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-on-surface-variant font-label-sm text-label-sm border-b border-outline-variant/20">
              <th class="py-2 pr-4 font-normal">縣市</th>
              <th class="py-2 pr-4 font-normal">天氣</th>
              <th class="py-2 pr-4 font-normal">溫度</th>
              <th class="py-2 pr-4 font-normal">降雨機率</th>
              <th class="py-2 pr-4 font-normal">空氣品質</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in overviewRows" :key="row.county" class="border-b border-outline-variant/10 last:border-0">
              <td class="py-3 pr-4 font-body-md text-body-md text-on-surface whitespace-nowrap">{{ row.county }}</td>
              <td class="py-3 pr-4">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-xl">{{ weatherIcon(row.block?.wx_text ?? null) }}</span>
                  <span class="font-body-md text-body-md text-on-surface-variant whitespace-nowrap">{{ row.block?.wx_text ?? '--' }}</span>
                </div>
              </td>
              <td class="py-3 pr-4 font-body-md text-body-md text-on-surface whitespace-nowrap">
                {{ row.block?.min_temp ?? '--' }}° - {{ row.block?.max_temp ?? '--' }}°
              </td>
              <td class="py-3 pr-4 font-body-md text-body-md text-primary font-bold">{{ row.block?.pop ?? '--' }}%</td>
              <td class="py-3 pr-4">
                <span class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: aqiColor(row.aqi) }" />
                  AQI: {{ row.aqi ?? '--' }}
                </span>
              </td>
            </tr>
            <tr v-if="!overviewLoading && overviewRows.length === 0">
              <td colspan="5" class="py-6 text-center text-on-surface-variant">目前沒有資料</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Detail: hero + hourly forecast + metrics for one location -->
    <template v-if="viewMode === 'detail'">
    <!-- Hero -->
    <section>
      <div class="glass-card rounded-xl p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div class="z-10 text-center md:text-left mb-6 md:mb-0">
          <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            {{ selectedCounty }} {{ selectedTownship }}
          </h2>
          <ClientOnly>
            <p class="font-body-lg text-body-lg text-on-surface-variant mb-6 flex items-center justify-center md:justify-start gap-2">
              <span v-if="locatingByGps" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm animate-pulse">my_location</span>
                定位中...
              </span>
              <span v-else>{{ formattedDate }}</span>
            </p>
          </ClientOnly>

          <div class="flex items-baseline justify-center md:justify-start gap-4">
            <span class="font-display-temp text-display-temp text-primary">{{ heroHour?.temp ?? '--' }}°</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-primary">arrow_upward</span> {{ heroBlock?.max_temp ?? '--' }}°
              <span class="material-symbols-outlined text-secondary ml-2">arrow_downward</span> {{ heroBlock?.min_temp ?? '--' }}°
            </span>
          </div>
          <p class="font-headline-md text-headline-md text-on-surface mt-2">{{ heroBlock?.wx_text ?? '載入中...' }}</p>
        </div>

        <div class="z-10 flex flex-col items-center">
          <span class="material-symbols-outlined text-primary" style="font-size: 120px; font-variation-settings: 'FILL' 1">
            {{ weatherIcon(heroBlock?.wx_text ?? null) }}
          </span>
          <div class="flex gap-3 mt-4">
            <div class="bg-surface-container-lowest/80 px-3 py-1 rounded-full border border-outline-variant/20 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-sm">water_drop</span>
              <span class="font-label-sm text-label-sm text-on-surface">{{ heroBlock?.pop ?? '--' }}%</span>
            </div>
            <div class="bg-surface-container-lowest/80 px-3 py-1 rounded-full border border-outline-variant/20 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-sm">air</span>
              <span class="font-label-sm text-label-sm text-on-surface">{{ heroHour?.wind_direction ?? '--' }} {{ heroHour?.wind_speed ?? '--' }} 級</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Hourly forecast -->
    <section class="glass-card rounded-xl p-6 mt-2">
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-headline-md text-headline-md text-on-surface">今日預報</h3>
      </div>
      <div class="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        <div
          v-for="(hour, index) in upcomingHours"
          :key="hour.data_time"
          class="flex-none w-24 flex flex-col items-center rounded-xl p-4 border transition-colors"
          :class="index === 0
            ? 'bg-primary/10 border-primary/30 shadow-sm'
            : 'bg-surface-container-lowest/40 border-outline-variant/10 hover:bg-white/60'"
        >
          <span
            class="font-label-sm text-label-sm mb-2"
            :class="index === 0 ? 'text-on-surface font-bold' : 'text-on-surface-variant'"
          >
            {{ formatHour(hour.data_time, index) }}
          </span>
          <span
            class="material-symbols-outlined mb-2 text-3xl"
            :class="index === 0 ? 'text-primary' : 'text-secondary'"
            :style="index === 0 ? { fontVariationSettings: '\'FILL\' 1' } : {}"
          >
            {{ weatherIcon(hour.wx_text) }}
          </span>
          <span class="font-headline-md text-headline-md text-on-surface">{{ hour.temp ?? '--' }}°</span>
          <span v-if="hour.pop" class="text-xs text-primary mt-1 font-semibold">{{ hour.pop }}%</span>
        </div>
      </div>
    </section>

    <!-- Detailed metrics -->
    <section>
      <h3 class="font-headline-md text-headline-md text-on-surface mb-6 px-2"></h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-stack-gap">
        <MetricCard
          icon="thermostat"
          label="體感溫度"
          :value="heroHour?.apparent_temp ?? '--'"
          unit="°"
          :caption="heroHour ? `舒適度指數 ${heroHour.comfort_index ?? '--'}` : undefined"
        />
        <MetricCard
          icon="air"
          label="風速"
          :value="heroHour?.wind_speed ?? '--'"
          unit="級"
          :caption="heroHour?.wind_direction ?? undefined"
        />
        <MetricCard
          icon="sunny"
          label="UV 指數"
          :value="heroUv?.uv_index ?? '--'"
          :progress="heroUv?.uv_index ? Math.min(100, (Number(heroUv.uv_index) / 12) * 100) : undefined"
          progress-class="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
        />
        <MetricCard
          icon="water_drop"
          label="濕度"
          :value="heroHour?.humidity ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="air"
          label="空氣品質"
          :value="pollution?.aqi != null ? String(pollution.aqi) : '--'"
          :caption="pollution ? `${pollution.sitename}測站・${pollution.status ?? ''}` : '附近無測站資料'"
          :progress="pollution?.aqi != null ? Math.min(100, (pollution.aqi / 200) * 100) : undefined"
          :progress-class="aqiProgressClass"
        />
      </div>
    </section>
    </template>
  </div>
</template>
