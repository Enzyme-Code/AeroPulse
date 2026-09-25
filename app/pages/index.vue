<script setup lang="ts">
const config = useRuntimeConfig()
const { selectedGeocode, ensureCitiesLoaded, restoreLastVisitedCity } = useCitySelection()
const { load } = useLocationWeather()

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

// The dashboard shows the last location the user viewed (or picked here) — never an
// automatic GPS lookup on page load; the header location picker's 目前定位 button is the opt-in for that.
const ready = ref(false)

onMounted(async () => {
  await ensureCitiesLoaded()
  if (!selectedGeocode.value) restoreLastVisitedCity()
  ready.value = true
})

watch([ready, selectedGeocode], ([isReady, geocode]) => {
  if (isReady && geocode) load()
})
</script>

<template>
  <div class="flex flex-col gap-space-lg md:gap-10">
    <LoadingState v-if="!ready" message="正在載入..." />

    <LocationDashboard v-else-if="selectedGeocode" />

    <template v-else>
      <section class="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-md p-space-xl flex flex-col items-center text-center gap-space-sm">
        <div class="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
        <span class="material-symbols-outlined text-primary text-[64px] z-10" style="font-variation-settings: 'FILL' 1">travel_explore</span>
        <h2 class="font-headline-md text-headline-md text-on-surface z-10">選擇地點，查看在地天氣</h2>
        <p class="font-body-md text-body-md text-on-surface-variant z-10">點右上角的地點選單選擇縣市與行政區，或按「目前定位」自動偵測您的位置。</p>
      </section>
      <CountyOverviewTable />
    </template>
  </div>
</template>
