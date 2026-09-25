<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const { cities, ensureCitiesLoaded, selectCity } = useCitySelection()
const { load } = useLocationWeather()

// Derived straight from the route (available synchronously, even during SSR before
// ensureCitiesLoaded()/selectCity() resolve) rather than from selectedCounty/
// selectedTownship, which start out empty until that async lookup finishes — using
// them here would make every one of the 368 location pages briefly render the same title.
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

async function syncFromRoute() {
  await ensureCitiesLoaded()

  const match = cities.value.find(c => c.county_name === routeCounty.value && c.township_name === routeTownship.value)

  if (!match) {
    router.replace('/')
    return
  }

  selectCity(match)
  await load()
}

watch(() => [route.params.county, route.params.township], syncFromRoute, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-space-lg md:gap-10">
    <LocationDashboard />
    <LocationDetailSections />
  </div>
</template>
