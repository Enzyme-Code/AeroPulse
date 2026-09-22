<script setup lang="ts">
interface HourlyRow {
  data_time: string
  wx_text: string | null
  pop: string | null
  temp: string | null
  humidity: string | null
  wind_direction: string | null
  wind_speed: string | null
}

interface Station {
  siteid: number
  sitename: string
  country: string
  longitude: number
  latitude: number
}

interface PollutionRow {
  siteid: number
  sitename: string
  aqi: number | null
  status: string | null
}

interface CityCardData {
  geocode: string
  county_name: string
  township_name: string
  hour: HourlyRow | null
  pollution: PollutionRow | null
}

usePageSeo({
  title: '已儲存城市 | AeroPulse',
  description: '快速比較您已儲存城市的即時天氣與空氣品質狀況。',
  // Content here comes from each visitor's own localStorage, so an anonymous crawl
  // always sees an empty list — indexing it would only surface a blank page.
  noindex: true
})

const { savedCities, load, addCity, removeCity } = useSavedCities()
const { cities, ensureCitiesLoaded } = useCitySelection()
const router = useRouter()

const cardData = ref<CityCardData[]>([])
const loading = ref(true)

async function loadCard(city: { geocode: string, county_name: string, township_name: string }): Promise<CityCardData> {
  const [hourlyRows, stations] = await Promise.all([
    $fetch<HourlyRow[]>('/api/weather/forecast-three-days', { query: { geocode: city.geocode } }),
    $fetch<Station[]>('/api/air/stations', { query: { country: city.county_name } })
  ])

  const hour = closestByTime(fillForwardHourly(hourlyRows), 'data_time')

  // Stations are only filtered down to the city's county, so still pick whichever one is
  // actually nearest to this township rather than always the alphabetically-first result.
  const cityInfo = cities.value.find(c => c.geocode === city.geocode)
  const nearestStation = cityInfo
    ? findNearestCity({ lat: cityInfo.latitude, lng: cityInfo.longitude }, stations)
    : (stations[0] ?? null)

  let pollution: PollutionRow | null = null
  if (nearestStation) {
    const rows = await $fetch<PollutionRow[]>('/api/air/pollution', { query: { siteId: nearestStation.siteid } })
    pollution = rows[0] ?? null
  }

  return { ...city, hour, pollution }
}

async function loadAll() {
  loading.value = true
  cardData.value = await Promise.all(savedCities.value.map(loadCard))
  loading.value = false
}

onMounted(async () => {
  load()
  await ensureCitiesLoaded()
  await loadAll()
})

watch(savedCities, loadAll)

function goToCity(city: CityCardData) {
  router.push(`/weather/${encodeURIComponent(city.county_name)}/${encodeURIComponent(city.township_name)}`)
}

const addQuery = ref('')
const addResults = computed(() => {
  const query = addQuery.value.trim()
  if (!query) return []

  return cities.value
    .filter(c => c.county_name.includes(query) || c.township_name.includes(query))
    .slice(0, 8)
})

function handleAddCity(city: (typeof cities.value)[number]) {
  addCity({ geocode: city.geocode, county_name: city.county_name, township_name: city.township_name })
  addQuery.value = ''
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">城市總覽</h2>
        <p class="font-body-md text-body-md text-on-surface-variant">掌握您關注城市的即時大氣狀況。</p>
      </div>

      <div class="relative w-full md:w-72">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">add_location_alt</span>
        <input
          v-model="addQuery"
          type="text"
          placeholder="新增城市..."
          class="w-full pl-10 pr-4 py-2 rounded-full glass-card border-none focus:ring-2 focus:ring-primary-fixed-dim bg-white/40 text-on-surface font-body-md text-body-md placeholder-on-surface-variant/50"
        >
        <ul
          v-if="addResults.length"
          class="absolute top-full mt-2 w-full glass-card rounded-lg overflow-hidden z-30 max-h-72 overflow-y-auto"
        >
          <li
            v-for="city in addResults"
            :key="city.geocode"
            class="px-4 py-2 hover:bg-primary/10 cursor-pointer text-body-md text-on-surface"
            @click="handleAddCity(city)"
          >
            {{ city.county_name }} {{ city.township_name }}
          </li>
        </ul>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="card in cardData"
        :key="card.geocode"
        class="glass-card rounded-xl p-6 flex flex-col cursor-pointer group relative"
        @click="goToCity(card)"
      >
        <button
          class="absolute top-3 right-3 text-on-surface-variant/50 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
          @click.stop="removeCity(card.geocode)"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
              {{ card.county_name }} {{ card.township_name }}
            </h3>
            <p class="font-body-md text-body-md text-on-surface-variant">台灣</p>
          </div>
          <span class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-full flex items-center gap-1">
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: aqiColor(card.pollution?.aqi) }" />
            AQI: {{ card.pollution?.aqi ?? '--' }}
          </span>
        </div>

        <div class="flex items-center justify-between mt-auto">
          <div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-5xl text-primary" style="font-variation-settings: 'wght' 200">
              {{ weatherIcon(card.hour?.wx_text ?? null, card.hour ? new Date(card.hour.data_time) : new Date()) }}
            </span>
            <div>
              <div class="font-display-temp text-4xl text-on-surface leading-none">{{ card.hour?.temp ?? '--' }}°C</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full inline-block mb-1">
              濕度: {{ card.hour?.humidity ?? '--' }}%
            </div>
            <div class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full inline-block">
              風速: {{ card.hour?.wind_speed ?? '--' }} 級
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && cardData.length === 0" class="col-span-full text-center text-on-surface-variant py-12">
        還沒有已儲存的城市，用上方欄位新增一個吧。
      </div>
    </div>
  </div>
</template>
