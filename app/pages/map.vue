<script setup lang="ts">
import type { Map as LeafletMap, LayerGroup } from 'leaflet'

interface City {
  county_name: string
  township_name: string
  longitude: number
  latitude: number
}

interface ThirtySixHourBlock {
  county_name: string
  start_time: string
  end_time: string
  wx_text: string | null
  pop: number | null
  min_temp: number | null
  max_temp: number | null
}

interface Station {
  siteid: number
  country: string
  sitename: string
  longitude: number
  latitude: number
}

interface Pollution {
  siteid: number
  aqi: number | null
  status: string | null
}

usePageSeo({
  title: '氣象地圖 | AeroPulse',
  description: '在地圖上瀏覽全台各縣市即時天氣與空氣品質(AQI)分布,快速掌握週邊地區的溫度、天氣狀況與測站空品數據。'
})

const loading = ref(true)
const showWeather = ref(true)
const showAqi = ref(true)

const cities = ref<City[]>([])
const blocks = ref<ThirtySixHourBlock[]>([])
const stations = ref<Station[]>([])
const pollution = ref<Pollution[]>([])

// The 36-hour forecast is per county, not per township, so approximate each county's
// marker position with the centroid of its townships' coordinates.
const countyCentroids = computed(() => {
  const grouped = new Map<string, City[]>()
  for (const city of cities.value) {
    const list = grouped.get(city.county_name) ?? []
    list.push(city)
    grouped.set(city.county_name, list)
  }

  return Array.from(grouped.entries()).map(([county, list]) => ({
    county,
    latitude: list.reduce((sum, c) => sum + c.latitude, 0) / list.length,
    longitude: list.reduce((sum, c) => sum + c.longitude, 0) / list.length
  }))
})

const currentBlockByCounty = computed(() => {
  const grouped = new Map<string, ThirtySixHourBlock[]>()
  for (const block of blocks.value) {
    const list = grouped.get(block.county_name) ?? []
    list.push(block)
    grouped.set(block.county_name, list)
  }

  const result = new Map<string, ThirtySixHourBlock | null>()
  for (const [county, rows] of grouped) result.set(county, currentBlock(rows))
  return result
})

const pollutionBySite = computed(() => new Map(pollution.value.map(p => [p.siteid, p])))

const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let weatherLayer: LayerGroup | null = null
let aqiLayer: LayerGroup | null = null

onMounted(async () => {
  const [citiesRes, blocksRes, stationsRes, pollutionRes] = await Promise.all([
    $fetch<City[]>('/api/cities'),
    $fetch<ThirtySixHourBlock[]>('/api/weather/36hour'),
    $fetch<Station[]>('/api/air/stations'),
    $fetch<Pollution[]>('/api/air/pollution')
  ])

  cities.value = citiesRes
  blocks.value = blocksRes
  stations.value = stationsRes
  pollution.value = pollutionRes
  loading.value = false

  if (!mapEl.value) return

  const L = (await import('leaflet')).default

  map = L.map(mapEl.value).setView([23.7, 121.0], 8)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map)

  weatherLayer = L.layerGroup()
  aqiLayer = L.layerGroup()

  for (const centroid of countyCentroids.value) {
    const block = currentBlockByCounty.value.get(centroid.county)
    if (!block) continue

    const icon = L.divIcon({
      className: '',
      html: `<div class="flex items-center gap-1 bg-primary text-on-primary rounded-full pl-1.5 pr-2.5 py-1 shadow-md whitespace-nowrap">
        <span class="material-symbols-outlined text-base">${weatherIcon(block.wx_text)}</span>
        <span class="font-label-sm text-label-sm">${block.max_temp ?? '--'}°C</span>
      </div>`,
      iconAnchor: [20, 14]
    })

    L.marker([centroid.latitude, centroid.longitude], { icon })
      .bindPopup(`
        <div class="font-body-md text-body-md">
          <div class="font-bold mb-1">${centroid.county}</div>
          <div>${block.wx_text ?? '--'}</div>
          <div>${block.min_temp ?? '--'}°C - ${block.max_temp ?? '--'}°C</div>
          <div>降雨機率 ${block.pop ?? '--'}%</div>
        </div>
      `)
      .addTo(weatherLayer)
  }

  for (const station of stations.value) {
    const reading = pollutionBySite.value.get(station.siteid)
    const aqi = reading?.aqi ?? null
    const color = aqiColor(aqi)

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color}" class="w-4 h-4 rounded-full border-2 border-white shadow-md"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })

    L.marker([station.latitude, station.longitude], { icon })
      .bindPopup(`
        <div class="font-body-md text-body-md">
          <div class="font-bold mb-1">${station.sitename}</div>
          <div>AQI: ${aqi ?? '--'}</div>
          <div>${reading?.status ?? '無資料'}</div>
        </div>
      `)
      .addTo(aqiLayer)
  }

  if (showWeather.value) weatherLayer.addTo(map)
  if (showAqi.value) aqiLayer.addTo(map)
})

onUnmounted(() => {
  map?.remove()
  map = null
})

watch(showWeather, (value) => {
  if (!map || !weatherLayer) return
  if (value) weatherLayer.addTo(map)
  else map.removeLayer(weatherLayer)
})

watch(showAqi, (value) => {
  if (!map || !aqiLayer) return
  if (value) aqiLayer.addTo(map)
  else map.removeLayer(aqiLayer)
})
</script>

<template>
  <div class="space-y-4">
    <div class="glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
      <h2 class="font-headline-md text-headline-md text-on-surface md:mr-auto">氣象地圖</h2>
      <div class="flex gap-2">
        <button
          class="flex-1 md:flex-none px-4 py-2 rounded-full font-body-md text-body-md transition-colors flex items-center justify-center gap-2"
          :class="showWeather ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
          @click="showWeather = !showWeather"
        >
          <span class="material-symbols-outlined text-lg">partly_cloudy_day</span>
          天氣
        </button>
        <button
          class="flex-1 md:flex-none px-4 py-2 rounded-full font-body-md text-body-md transition-colors flex items-center justify-center gap-2"
          :class="showAqi ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
          @click="showAqi = !showAqi"
        >
          <span class="material-symbols-outlined text-lg">aq</span>
          空氣品質
        </button>
      </div>
    </div>

    <div class="glass-card rounded-xl overflow-hidden relative">
      <div ref="mapEl" class="w-full h-[50vh] md:h-[70vh]" />
      <LoadingState v-if="loading" overlay message="正在載入地圖資料..." />
    </div>

    <div v-if="showAqi" class="glass-card rounded-xl p-4 grid grid-cols-2 md:flex md:flex-wrap gap-x-3 gap-y-2 md:items-center md:gap-4 font-label-sm text-label-sm text-on-surface-variant">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full shrink-0" style="background:#10B981" /> 良好 0-50</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full shrink-0" style="background:#F59E0B" /> 普通 51-100</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full shrink-0" style="background:#F97316" /> 對敏感族群不健康 101-150</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full shrink-0" style="background:#EF4444" /> 不健康 151+</span>
    </div>
  </div>
</template>
