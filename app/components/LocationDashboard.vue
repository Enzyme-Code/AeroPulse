<script setup lang="ts">
// The mockup's location dashboard, rendering whatever useLocationWeather() last loaded.
// Shared by the home page (remembered location) and /weather/[county]/[township].
const { selectedCounty, selectedTownship, selectedGeocode } = useCitySelection()
const { savedCities, load: loadSavedCities, addCity, removeCity } = useSavedCities()
const { weekly, pollution, loading, heroBlock, heroHour, heroUv, upcomingHours } = useLocationWeather()
const { formatTemp, toDisplay, unitLabel } = useTemperatureUnit()

const isSaved = computed(() => savedCities.value.some(c => c.geocode === selectedGeocode.value))

function toggleSaved() {
  if (!selectedGeocode.value) return
  if (isSaved.value) {
    removeCity(selectedGeocode.value)
  } else {
    addCity({ geocode: selectedGeocode.value, county_name: selectedCounty.value, township_name: selectedTownship.value })
  }
}

const now = ref(new Date())
onMounted(() => {
  loadSavedCities()
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

const uvIndex = computed(() => (heroUv.value?.uv_index != null ? Number(heroUv.value.uv_index) : null))
const uv = computed(() => uvLevel(uvIndex.value))

const humidity = computed(() => (heroHour.value?.humidity != null ? Number(heroHour.value.humidity) : null))
const dewPoint = computed(() => (heroHour.value?.dew_point != null ? Number(heroHour.value.dew_point) : null))

const tips = computed(() => lifestyleTips({
  heroHour: heroHour.value,
  heroBlock: heroBlock.value,
  upcomingHours: upcomingHours.value,
  weekly: weekly.value,
  uvIndex: uvIndex.value,
  pollution: pollution.value
}))
</script>

<template>
  <div class="flex flex-col gap-space-lg md:gap-10">
    <LoadingState v-if="loading" message="正在載入天氣與空氣品質資料..." />

    <template v-else>
      <!-- Hero -->
      <section class="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-md p-space-lg md:p-10 flex flex-col md:flex-row items-center justify-between gap-space-lg md:gap-space-xl">
        <div class="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
        <div class="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none" />

        <div class="flex flex-col gap-space-md z-10 w-full md:w-auto">
          <div class="flex flex-wrap items-center gap-space-sm">
            <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
              {{ selectedCounty }} {{ selectedTownship }}
            </h2>
            <ClientOnly>
              <button
                type="button"
                class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                :class="isSaved ? 'bg-error-container/60 text-error' : 'bg-surface-container-low text-on-surface-variant hover:text-error hover:bg-error-container/40'"
                :title="isSaved ? '從已儲存城市移除' : '加入已儲存城市'"
                :aria-label="isSaved ? '從已儲存城市移除' : '加入已儲存城市'"
                :aria-pressed="isSaved"
                @click="toggleSaved"
              >
                <span class="material-symbols-outlined text-[18px]" :style="isSaved ? { fontVariationSettings: '\'FILL\' 1' } : {}">favorite</span>
              </button>
            </ClientOnly>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              即時更新
            </span>
          </div>
          <ClientOnly>
            <p class="font-body-sm text-body-sm text-on-surface-variant">{{ formattedDate }}<span class="hidden sm:inline"> · </span><span class="block sm:inline">資料來源：中央氣象署</span></p>
          </ClientOnly>

          <div class="flex flex-nowrap md:flex-wrap items-center md:items-baseline gap-x-space-sm md:gap-x-space-md gap-y-space-xs mt-space-xs">
            <span class="font-display-hero text-display-hero-mobile md:text-display-hero text-primary tracking-tighter">{{ formatTemp(heroHour?.temp) }}</span>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-space-sm font-title-md text-title-md whitespace-nowrap">
                <span class="text-error flex items-center"><span class="material-symbols-outlined text-[18px]">arrow_upward</span>{{ formatTemp(heroBlock?.max_temp) }}</span>
                <span class="text-secondary flex items-center"><span class="material-symbols-outlined text-[18px]">arrow_downward</span>{{ formatTemp(heroBlock?.min_temp) }}</span>
              </div>
              <span class="font-headline-sm text-headline-sm text-on-surface font-medium">{{ heroBlock?.wx_text ?? '--' }}</span>
            </div>

          </div>

          <div class="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-space-xs mt-space-sm">
            <div class="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-title-sm text-title-sm shadow-sm">
              <span class="material-symbols-outlined text-[18px] text-primary">rainy</span>
              <span>降雨機率 {{ heroBlock?.pop ?? '--' }}%</span>
            </div>
            <div class="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-title-sm text-title-sm">
              <span class="material-symbols-outlined text-[18px] text-secondary">air</span>
              <span>{{ heroHour?.wind_direction ?? '--' }} {{ heroHour?.wind_speed ?? '--' }} 級</span>
            </div>
            <div v-if="heroBlock?.ci_text" class="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-title-sm text-title-sm">
              <span class="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
              <span>體感：{{ heroBlock.ci_text }}</span>
            </div>
          </div>
        </div>

        <!-- Phones: icon fills the empty corner beside the stacked pills -->
        <span
          class="md:hidden absolute right-space-lg bottom-space-lg z-10 material-symbols-outlined text-primary text-[104px] leading-none drop-shadow-xl pointer-events-none"
          style="font-variation-settings: 'FILL' 1"
          aria-hidden="true"
        >
          {{ weatherIcon(heroBlock?.wx_text ?? null) }}
        </span>

        <div class="relative hidden md:flex items-center justify-center z-10 shrink-0">
          <div class="absolute w-48 h-48 rounded-full bg-primary-fixed/50 blur-2xl" />
          <span
            class="relative material-symbols-outlined text-primary drop-shadow-xl text-[160px] leading-none"
            style="font-variation-settings: 'FILL' 1"
          >
            {{ weatherIcon(heroBlock?.wx_text ?? null) }}
          </span>
        </div>
      </section>

      <HourlyForecastStrip :hours="upcomingHours" />

      <!-- Essential conditions -->
      <section class="flex flex-col gap-space-md">
        <div class="flex items-center gap-space-xs">
          <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">基礎天氣狀況</h3>
          <span v-if="heroHour?.weather_description" class="relative group inline-flex">
            <span class="material-symbols-outlined text-[18px] text-outline cursor-help">info</span>
            <span class="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm shadow-lg z-10">
              {{ heroHour.weather_description }}
            </span>
          </span>
        </div>
        <ClientOnly>
          <div
            class="grid grid-cols-2 md:grid-cols-3 gap-space-sm sm:gap-space-md md:gap-space-lg"
            :class="isDaytime ? 'lg:grid-cols-6' : 'lg:grid-cols-5'"
          >
            <MetricCard
              icon="thermostat"
              label="體感溫度"
              :value="toDisplay(heroHour?.apparent_temp)"
              :unit="unitLabel"
              :caption="heroHour?.comfort_index ? `舒適度指數 ${heroHour.comfort_index}` : undefined"
            />
            <MetricCard
              icon="air"
              icon-class="text-secondary"
              label="風速與風向"
              :value="heroHour?.wind_speed ?? '--'"
              unit=" 級"
              :caption="heroHour?.wind_direction ?? undefined"
            />
            <MetricCard
              v-if="isDaytime"
              icon="sunny"
              icon-class="text-primary-container"
              label="UV 紫外線"
              :value="heroUv?.uv_index ?? '--'"
              :badge="uv?.name"
              :badge-class="uv?.colorClass"
              :progress="uvIndex != null ? Math.min(100, (uvIndex / 12) * 100) : undefined"
              progress-class="bg-gradient-to-r from-tertiary via-secondary-container to-error"
            />
            <MetricCard
              icon="humidity_percentage"
              label="相對濕度"
              :value="heroHour?.humidity ?? '--'"
              unit="%"
              :caption="humidityCaption(humidity)"
            />
            <MetricCard
              icon="dew_point"
              icon-class="text-secondary"
              label="露點溫度"
              :value="toDisplay(heroHour?.dew_point)"
              :unit="unitLabel"
              :caption="dewPointCaption(dewPoint)"
            />
            <MetricCard
              icon="eco"
              label="空氣品質 AQI"
              icon-class="text-[color:var(--aqi)]"
              :value="pollution?.aqi != null ? String(pollution.aqi) : '--'"
              :badge="pollution?.status ?? undefined"
              :caption="pollution ? `${pollution.sitename}站` : '附近無測站資料'"
              info="空氣品質指標(AQI),取當日各污染物副指標中的最大值,0-500分成6個等級,數字越大代表空氣品質越差、對健康影響越大。"
              :style="{ '--aqi': aqiColor(pollution?.aqi) }"
              value-class="text-[color:var(--aqi)]"
              badge-class="text-[color:var(--aqi)]"
            >
              <template #footer>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-x-2 text-[11px] text-outline">
                  <span>{{ pollution ? `${pollution.sitename}站` : '附近無測站資料' }}</span>
                  <span v-if="pollution?.pm2_5 != null">PM2.5: {{ pollution.pm2_5 }} µg/m³</span>
                </div>
              </template>
            </MetricCard>
          </div>
          <template #fallback>
            <div class="h-36 rounded-2xl bg-surface-container-lowest/60 animate-pulse" />
          </template>
        </ClientOnly>
      </section>

      <!-- Lower: nationwide table + weekly trend & lifestyle tips -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg md:gap-space-xl">
        <CountyOverviewTable
          class="lg:col-span-7"
          :limit="7"
          :highlight-county="selectedCounty"
          :highlight-township="selectedTownship"
        />

        <div class="lg:col-span-5 flex flex-col gap-space-lg md:gap-space-xl">
          <WeeklyTrendCard :rows="weekly" />

          <section class="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg md:p-space-xl shadow-sm flex flex-col gap-space-lg">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[20px]">recommend</span>
              <h3 class="font-headline-sm text-headline-sm text-on-surface">生活氣象小秘笈</h3>
            </div>
            <div class="grid grid-cols-2 gap-space-sm sm:gap-space-md">
              <div v-for="tip in tips" :key="tip.title" class="p-space-sm sm:p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start gap-space-sm sm:gap-space-md">
                <div class="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-sm shrink-0" :class="tip.iconClass">
                  <span class="material-symbols-outlined text-[18px]">{{ tip.icon }}</span>
                </div>
                <div class="min-w-0">
                  <span class="font-title-sm text-title-sm text-on-surface block">{{ tip.title }}</span>
                  <span class="font-body-sm text-body-sm text-outline">{{ tip.text }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
