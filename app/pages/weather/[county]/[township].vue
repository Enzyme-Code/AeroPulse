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
  wx_text: string | null
  pop: string | null
  avg_temp: string | null
  min_temp: string | null
  max_temp: string | null
  avg_dew_point: string | null
  avg_humidity: string | null
  wind_direction: string | null
  wind_speed: string | null
  max_apparent_temp: string | null
  min_apparent_temp: string | null
  max_comfort_index: string | null
  min_comfort_index: string | null
  uv_index: string | null
  weather_description: string | null
}

interface Station {
  siteid: number
  sitename: string
  country: string
  longitude: number
  latitude: number
}

interface Pollution {
  siteid: number
  sitename: string
  country: string
  aqi: number | null
  status: string | null
  pollutant: string | null
  so2: string | null
  co: string | null
  o3: string | null
  o3_8hr: string | null
  pm10: number | null
  pm2_5: string | null
  no2: string | null
  nox: string | null
  no: string | null
  co_8hr: string | null
  wind_speed: string | null
  wind_direc: string | null
  pm2_5_avg: string | null
  pm10_avg: string | null
  so2_avg: string | null
}

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const { cities, selectedCounty, selectedTownship, selectedGeocode, ensureCitiesLoaded, selectCity } = useCitySelection()

// Derived straight from the route (available synchronously, even during SSR before
// ensureCitiesLoaded()/selectCity() resolve) rather than from selectedCounty/
// selectedTownship, which start out defaulted to 臺北市/大安區 until that async lookup
// finishes — using them here would make every one of the 368 location pages briefly
// render the same title on first load.
const routeCounty = computed(() => String(route.params.county ?? ''))
const routeTownship = computed(() => String(route.params.township ?? ''))

usePageSeo({
  title: () => `${routeCounty.value} ${routeTownship.value} 天氣預報與空氣品質 | AeroPulse`,
  description: () => `查詢${routeCounty.value}${routeTownship.value}即時天氣、36小時預報、一週天氣概況與空氣品質(AQI)資訊。`
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      // No standalone page exists per county, so this is a flat 首頁 -> 縣市+鄉鎮 trail
      // rather than a three-level one.
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: config.public.siteUrl },
        { '@type': 'ListItem', position: 2, name: `${routeCounty.value} ${routeTownship.value}`, item: `${config.public.siteUrl}/weather/${encodeURIComponent(routeCounty.value)}/${encodeURIComponent(routeTownship.value)}` }
      ]
    })
  }]
})

// County/township dropdowns mirror the current route params, but only navigate
// (and only then trigger a data refresh) once both levels are picked.
const draftCounty = ref('')
const draftTownship = ref('')

const countyOptions = computed(() => Array.from(new Set(cities.value.map(c => c.county_name))))

const townshipOptions = computed(() =>
  cities.value.filter(c => c.county_name === draftCounty.value).map(c => c.township_name)
)

function commitDraftSelection() {
  if (!draftCounty.value || !draftTownship.value) return
  router.push(`/weather/${encodeURIComponent(draftCounty.value)}/${encodeURIComponent(draftTownship.value)}`)
}

function onCountyChange() {
  const firstTownship = cities.value.find(c => c.county_name === draftCounty.value)
  draftTownship.value = firstTownship?.township_name ?? ''
  commitDraftSelection()
}

const thirtySixHour = ref<ThirtySixHourBlock[]>([])
const hourly = ref<HourlyRow[]>([])
const weekly = ref<WeeklyRow[]>([])
const pollution = ref<Pollution | null>(null)
const loading = ref(true)

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

  // Stations are only filtered down to the selected county, so still pick whichever one is
  // actually nearest to the selected township — otherwise every township in the county would
  // show the same (alphabetically-first) station.
  const currentCity = cities.value.find(c => c.geocode === selectedGeocode.value)
  const nearestStation = currentCity
    ? findNearestCity({ lat: currentCity.latitude, lng: currentCity.longitude }, stations)
    : (stations[0] ?? null)

  if (nearestStation) {
    const rows = await $fetch<Pollution[]>('/api/air/pollution', { query: { siteId: nearestStation.siteid } })
    pollution.value = rows[0] ?? null
  } else {
    pollution.value = null
  }

  loading.value = false
}

async function syncFromRoute() {
  await ensureCitiesLoaded()

  const county = String(route.params.county ?? '')
  const township = String(route.params.township ?? '')
  const match = cities.value.find(c => c.county_name === county && c.township_name === township)

  if (!match) {
    router.replace('/')
    return
  }

  draftCounty.value = match.county_name
  draftTownship.value = match.township_name
  selectCity(match)
  await loadDashboard()
}

watch(() => [route.params.county, route.params.township], syncFromRoute, { immediate: true })

// UV index is only published for one daytime block per day; nearby blocks can be null, so
// search among blocks that actually have a reading rather than whichever block covers "now".
function currentWeeklyBlock(rows: WeeklyRow[]): WeeklyRow | null {
  const withUv = rows.filter(r => r.uv_index != null)
  return closestByTime(withUv, 'start_time')
}

const heroBlock = computed(() => currentBlock(thirtySixHour.value))
const heroHour = computed(() => closestByTime(filledHourly.value, 'data_time'))
const heroUv = computed(() => currentWeeklyBlock(weekly.value))
const heroWeekly = computed(() => closestByTime(weekly.value, 'start_time'))
const filledHourly = computed(() => fillForwardHourly(hourly.value))

const upcomingHours = computed(() => {
  const now = Date.now()
  return filledHourly.value.filter(r => new Date(r.data_time).getTime() >= now - 30 * 60 * 1000).slice(0, 24)
})

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
const hourlyScrollEl = ref<HTMLElement | null>(null)
const canScrollHourlyLeft = ref(false)
const canScrollHourlyRight = ref(false)

function updateHourlyScrollState() {
  const el = hourlyScrollEl.value
  if (!el) return
  canScrollHourlyLeft.value = el.scrollLeft > 4
  canScrollHourlyRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollHourly(direction: 1 | -1) {
  hourlyScrollEl.value?.scrollBy({ left: direction * 240, behavior: 'smooth' })
}

onMounted(() => {
  updateHourlyScrollState()
  window.addEventListener('resize', updateHourlyScrollState)
  onUnmounted(() => window.removeEventListener('resize', updateHourlyScrollState))
})
watch(upcomingHours, () => nextTick(updateHourlyScrollState))

const now = ref(new Date())
onMounted(() => {
  const timer = setInterval(() => { now.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(timer))
})

const formattedDate = computed(() => now.value.toLocaleDateString('zh-TW', {
  month: 'long', day: 'numeric', weekday: 'long'
}) + ' | ' + now.value.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' }))

// UV index isn't meaningful after dark; only surface it during daylight hours.
const isDaytime = computed(() => {
  const hour = now.value.getHours()
  return hour >= 6 && hour < 18
})

// Taiwan EPA (環境部) AQI breakpoint table, 114年版 (effective 2025), one
// linear-interpolation segment per {concentration range -> sub-index range}.
// Source: https://airtw.moenv.gov.tw/cht/Information/Standard/AirQualityIndicatorNew.aspx
interface AqiBreakpoint { cLow: number, cHigh: number, iLow: number, iHigh: number }

const AQI_BREAKPOINTS: Record<string, AqiBreakpoint[]> = {
  pm25: [ // µg/m³, 24hr
    { cLow: 0, cHigh: 12.4, iLow: 0, iHigh: 50 },
    { cLow: 12.5, cHigh: 30.4, iLow: 51, iHigh: 100 },
    { cLow: 30.5, cHigh: 50.4, iLow: 101, iHigh: 150 },
    { cLow: 50.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
    { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
    { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
    { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
  ],
  pm10: [ // µg/m³, 24hr
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 190, iLow: 101, iHigh: 150 },
    { cLow: 191, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 }
  ],
  o3_8h: [ // ppb, 8hr
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
    { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 }
  ],
  co_8h: [ // ppm, 8hr
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
    { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 }
  ],
  so2_1h: [ // ppb, 1hr
    { cLow: 0, cHigh: 8, iLow: 0, iHigh: 50 },
    { cLow: 9, cHigh: 65, iLow: 51, iHigh: 100 },
    { cLow: 66, cHigh: 160, iLow: 101, iHigh: 150 },
    { cLow: 161, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
    { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 }
  ],
  no2_1h: [ // ppb, 1hr
    { cLow: 0, cHigh: 21, iLow: 0, iHigh: 50 },
    { cLow: 22, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
    { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 }
  ]
}

const AQI_LEVELS = [
  { max: 50, name: '良好', colorClass: 'bg-green-400' },
  { max: 100, name: '普通', colorClass: 'bg-yellow-400' },
  { max: 150, name: '對敏感族群不健康', colorClass: 'bg-orange-400' },
  { max: 200, name: '對所有族群不健康', colorClass: 'bg-red-500' },
  { max: 300, name: '非常不健康', colorClass: 'bg-purple-500' },
  { max: Infinity, name: '危害', colorClass: 'bg-rose-900' }
]

function aqiLevel(index: number) {
  return AQI_LEVELS.find(l => index <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

// Standard EPA-style linear interpolation within the matched breakpoint segment.
function subIndex(table: AqiBreakpoint[], concentration: number): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null
  const bp = table.find(b => concentration >= b.cLow && concentration <= b.cHigh)
  if (bp) return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow)
  return concentration > table[table.length - 1].cHigh ? 500 : 0
}

function pollutantGauge(table: AqiBreakpoint[], raw: string | number | null | undefined) {
  const value = raw == null ? NaN : Number(raw)
  if (!Number.isFinite(value)) return undefined
  const index = subIndex(table, value)
  if (index == null) return undefined
  const level = aqiLevel(index)
  return { progress: Math.min(100, (index / 500) * 100), progressClass: level.colorClass, caption: level.name }
}

const aqiProgressClass = computed(() => aqiLevel(pollution.value?.aqi ?? 0).colorClass)

const pm10Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.pm10, pollution.value?.pm10))
const pm25Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.pm25, pollution.value?.pm2_5))
const o3Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.o3_8h, pollution.value?.o3_8hr))
const coGauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.co_8h, pollution.value?.co_8hr))
const so2Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.so2_1h, pollution.value?.so2))
const no2Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.no2_1h, pollution.value?.no2))
</script>

<template>
  <div>
    <!-- Location picker -->
    <div class="flex items-center gap-2 mb-2 md:justify-center">
      <select
        v-model="draftCounty"
        class="flex-1 md:flex-none md:w-40 pl-3 pr-2 py-2 rounded-full glass-card border-none focus:ring-2 focus:ring-primary-fixed-dim bg-white/40 text-on-surface font-body-md text-body-md"
        @change="onCountyChange"
      >
        <option v-for="county in countyOptions" :key="county" :value="county">{{ county }}</option>
      </select>
      <select
        v-model="draftTownship"
        class="flex-1 md:flex-none md:w-40 pl-3 pr-2 py-2 rounded-full glass-card border-none focus:ring-2 focus:ring-primary-fixed-dim bg-white/40 text-on-surface font-body-md text-body-md"
        @change="commitDraftSelection"
      >
        <option v-for="township in townshipOptions" :key="township" :value="township">{{ township }}</option>
      </select>
    </div>

    <LoadingState v-if="loading" message="正在載入天氣與空氣品質資料..." />

    <template v-else>
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
              {{ formattedDate }}
            </p>
          </ClientOnly>

          <div class="flex flex-wrap items-baseline justify-center md:justify-start gap-x-4 gap-y-2">
            <span class="font-display-temp text-6xl md:text-display-temp text-primary">{{ heroHour?.temp ?? '--' }}°C</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-primary">arrow_upward</span> {{ heroBlock?.max_temp ?? '--' }}°C
              <span class="material-symbols-outlined text-secondary ml-2">arrow_downward</span> {{ heroBlock?.min_temp ?? '--' }}°C
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
      <div class="relative">
        <button
          v-if="canScrollHourlyLeft"
          type="button"
          aria-label="上一批時段"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full glass-card border border-outline-variant/20 shadow-sm flex items-center justify-center text-on-surface hover:bg-white/80"
          @click="scrollHourly(-1)"
        >
          <span class="material-symbols-outlined text-xl">chevron_left</span>
        </button>
        <div
          ref="hourlyScrollEl"
          class="flex overflow-x-auto gap-4 pb-4 no-scrollbar"
          @scroll="updateHourlyScrollState"
        >
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
              {{ weatherIcon(hour.wx_text, new Date(hour.data_time)) }}
            </span>
            <span class="font-headline-md text-headline-md text-on-surface">{{ hour.temp ?? '--' }}°C</span>
            <span v-if="hour.pop" class="text-xs text-primary mt-1 font-semibold">{{ hour.pop }}%</span>
          </div>
        </div>
        <button
          v-if="canScrollHourlyRight"
          type="button"
          aria-label="下一批時段"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full glass-card border border-outline-variant/20 shadow-sm flex items-center justify-center text-on-surface hover:bg-white/80"
          @click="scrollHourly(1)"
        >
          <span class="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>
    </section>

    <!-- Detailed metrics -->
    <section class="glass-card rounded-xl p-6 mt-2">
      <div class="flex items-center gap-1.5 mb-6 px-2">
        <h3 class="font-headline-md text-headline-md text-on-surface">基礎天氣狀況</h3>
        <span v-if="heroHour?.weather_description" class="relative group inline-flex">
          <span class="material-symbols-outlined text-on-surface-variant text-lg cursor-help">error</span>
          <span class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-surface-container-highest text-on-surface font-body-md text-body-md shadow-lg z-10">
            {{ heroHour.weather_description }}
          </span>
        </span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-stack-gap">
        <MetricCard
          icon="thermostat"
          label="體感溫度"
          :value="heroHour?.apparent_temp ?? '--'"
          unit="°C"
          :caption="heroHour ? `舒適度指數 ${heroHour.comfort_index ?? '--'}` : undefined"
        />
        <MetricCard
          icon="air"
          label="風速"
          :value="heroHour?.wind_speed ?? '--'"
          unit="級"
          :caption="heroHour?.wind_direction ?? undefined"
        />
        <ClientOnly>
          <MetricCard
            v-if="isDaytime"
            icon="sunny"
            label="UV 指數"
            :value="heroUv?.uv_index ?? '--'"
            :progress="heroUv?.uv_index ? Math.min(100, (Number(heroUv.uv_index) / 12) * 100) : undefined"
            progress-class="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
          />
        </ClientOnly>
        <MetricCard
          icon="water_drop"
          label="濕度"
          :value="heroHour?.humidity ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="humidity_mid"
          label="露點溫度"
          :value="heroHour?.dew_point ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="aq"
          label="空氣品質"
          :value="pollution?.aqi != null ? String(pollution.aqi) : '--'"
          :caption="pollution ? `${pollution.sitename}測站・${pollution.status ?? ''}` : '附近無測站資料'"
          :progress="pollution?.aqi != null ? Math.min(100, (pollution.aqi / 500) * 100) : undefined"
          :progress-class="aqiProgressClass"
          info="空氣品質指標(AQI),取當日各污染物副指標中的最大值,0-500分成6個等級,數字越大代表空氣品質越差、對健康影響越大。"
        />
      </div>
    </section>

    <!-- Weekly overview -->
    <section class="glass-card rounded-xl p-6 mt-2">
      <div class="flex items-center gap-1.5 mb-6 px-2">
        <h3 class="font-headline-md text-headline-md text-on-surface">一週天氣概況</h3>
        <span v-if="heroWeekly?.weather_description" class="relative group inline-flex">
          <span class="material-symbols-outlined text-on-surface-variant text-lg cursor-help">error</span>
          <span class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-surface-container-highest text-on-surface font-body-md text-body-md shadow-lg z-10">
            {{ heroWeekly.weather_description }}
          </span>
        </span>
      </div>
      <ClientOnly>
        <WeeklyForecastChart v-if="weekly.length" :rows="weekly" class="mb-6" />
        <template #fallback>
          <div class="w-full h-72 mb-6 animate-pulse bg-surface-container-lowest/40 rounded-xl" />
        </template>
      </ClientOnly>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-stack-gap">
        <MetricCard
          icon="thermostat"
          label="平均溫度"
          :value="heroWeekly?.avg_temp ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="arrow_upward"
          label="最高溫度"
          :value="heroWeekly?.max_temp ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="arrow_downward"
          label="最低溫度"
          :value="heroWeekly?.min_temp ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="water_drop"
          label="平均相對濕度"
          :value="heroWeekly?.avg_humidity ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="grain"
          label="平均露點溫度"
          :value="heroWeekly?.avg_dew_point ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="rainy"
          label="12小時降雨機率"
          :value="heroWeekly?.pop ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="thermostat"
          label="最高體感溫度"
          :value="heroWeekly?.max_apparent_temp ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="thermostat"
          label="最低體感溫度"
          :value="heroWeekly?.min_apparent_temp ?? '--'"
          unit="°C"
        />
        <MetricCard
          icon="mood"
          label="最大舒適度指數"
          :value="heroWeekly?.max_comfort_index ?? '--'"
        />
        <MetricCard
          icon="mood"
          label="最小舒適度指數"
          :value="heroWeekly?.min_comfort_index ?? '--'"
        />
        <MetricCard
          icon="air"
          label="風速"
          :value="heroWeekly?.wind_speed ?? '--'"
          unit="級"
          :caption="heroWeekly?.wind_direction ?? undefined"
        />
      </div>
    </section>

    <!-- Air quality detail -->
    <section class="glass-card rounded-xl p-6 mt-2">
      <div class="flex items-center gap-1.5 mb-6 px-2">
        <h3 class="font-headline-md text-headline-md text-on-surface">空氣品質詳情</h3>
        <span v-if="pollution?.pollutant" class="relative group inline-flex">
          <span class="material-symbols-outlined text-on-surface-variant text-lg cursor-help">error</span>
          <span class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-surface-container-highest text-on-surface font-body-md text-body-md shadow-lg z-10">
            主要污染物：{{ pollution.pollutant }}
          </span>
        </span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-stack-gap">
        <MetricCard
          icon="blur_on"
          label="PM10"
          :value="pollution?.pm10 != null ? String(pollution.pm10) : '--'"
          unit="μg/m³"
          :caption="pm10Gauge?.caption"
          :progress="pm10Gauge?.progress"
          :progress-class="pm10Gauge?.progressClass"
          hide-progress-on-mobile
          info="懸浮微粒。24小時平均濃度,數值依環境部AQI分級換算,顏色越偏紅紫代表濃度越高、對呼吸道影響越大。"
        />
        <MetricCard
          icon="grain"
          label="PM2.5"
          :value="pollution?.pm2_5 ?? '--'"
          unit="μg/m³"
          :caption="pm25Gauge?.caption"
          :progress="pm25Gauge?.progress"
          :progress-class="pm25Gauge?.progressClass"
          hide-progress-on-mobile
          info="細懸浮微粒,粒徑更小可深入肺部與血管。24小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="blur_on"
          label="PM10 平均"
          :value="pollution?.pm10_avg ?? '--'"
          unit="μg/m³"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的24小時值。"
        />
        <MetricCard
          icon="grain"
          label="PM2.5 平均"
          :value="pollution?.pm2_5_avg ?? '--'"
          unit="μg/m³"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的24小時值。"
        />
        <MetricCard
          icon="wb_sunny"
          label="臭氧 O3"
          mobile-label="臭氧"
          :value="pollution?.o3 ?? '--'"
          unit="ppb"
          info="臭氧當前濃度(非用於AQI計算的8小時平均值)。高濃度易在夏季晴朗午後出現,刺激眼睛與呼吸道。"
        />
        <MetricCard
          icon="wb_sunny"
          label="臭氧 8小時平均"
          mobile-label="臭氧平均"
          :value="pollution?.o3_8hr ?? '--'"
          unit="ppb"
          :caption="o3Gauge?.caption"
          :progress="o3Gauge?.progress"
          :progress-class="o3Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的8小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="local_fire_department"
          label="一氧化碳 CO"
          mobile-label="一氧化碳"
          :value="pollution?.co ?? '--'"
          unit="ppm"
          info="一氧化碳當前濃度(非用於AQI計算的8小時平均值),主要來自燃燒與交通排放。"
        />
        <MetricCard
          icon="local_fire_department"
          label="一氧化碳 8小時平均"
          mobile-label="一氧化碳平均"
          :value="pollution?.co_8hr ?? '--'"
          unit="ppm"
          :caption="coGauge?.caption"
          :progress="coGauge?.progress"
          :progress-class="coGauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的8小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="science"
          label="二氧化硫 SO2"
          mobile-label="二氧化硫"
          :value="pollution?.so2 ?? '--'"
          unit="ppb"
          :caption="so2Gauge?.caption"
          :progress="so2Gauge?.progress"
          :progress-class="so2Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的1小時濃度,數值依環境部AQI分級換算。主要來自工業與燃煤排放。"
        />
        <MetricCard
          icon="science"
          label="SO2 平均"
          mobile-label="二氧化硫平均"
          :value="pollution?.so2_avg ?? '--'"
          unit="ppb"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的1小時值。"
        />
        <MetricCard
          icon="science"
          label="二氧化氮 NO2"
          mobile-label="二氧化氮"
          :value="pollution?.no2 ?? '--'"
          unit="ppb"
          :caption="no2Gauge?.caption"
          :progress="no2Gauge?.progress"
          :progress-class="no2Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的1小時濃度,數值依環境部AQI分級換算。主要來自機動車輛排放。"
        />
        <MetricCard
          icon="science"
          label="一氧化氮 NO"
          mobile-label="一氧化氮"
          :value="pollution?.no ?? '--'"
          unit="ppb"
          info="氮氧化物的一種,非AQI計算項目,常作為交通污染來源的參考指標。"
        />
        <MetricCard
          icon="science"
          label="氮氧化物 NOx"
          mobile-label="氮氧化物"
          :value="pollution?.nox ?? '--'"
          unit="ppb"
          info="NO 與 NO2 的總和,非AQI計算項目,常作為交通污染來源的參考指標。"
        />
        <MetricCard
          icon="air"
          label="測站風速"
          :value="pollution?.wind_speed ?? '--'"
          unit="m/s"
          info="測站當地風速,風速越大越有助於污染物擴散、降低濃度。"
        />
        <MetricCard
          icon="explore"
          label="測站風向"
          :value="pollution?.wind_direc ?? '--'"
          unit="°"
          info="測站當地風向(氣象角度,0°/360°為北風、90°為東風)。"
        />
      </div>
    </section>
    </template>
  </div>
</template>
