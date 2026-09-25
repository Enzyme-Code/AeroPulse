<script setup lang="ts">
const route = useRoute()

const navItems = computed(() => [
  { label: '首頁', icon: 'dashboard', to: '/' },
  { label: '氣象地圖', icon: 'map', to: '/map' },
  { label: '全台即時概況', mobileLabel: '全台概況', icon: 'public', to: '/overview' },
  { label: '已儲存城市', mobileLabel: '已儲存', icon: 'location_city', to: '/saved-cities' }
].map(item => ({ ...item, active: route.path === item.to })))

const { selectedCounty, selectedTownship, myLocation, resolveMyLocation } = useCitySelection()
const { unit, setUnit, load: loadTemperatureUnit } = useTemperatureUnit()

const now = ref(new Date())
onMounted(() => {
  const timer = setInterval(() => { now.value = new Date() }, 1_000)
  onUnmounted(() => {
    clearInterval(timer)
  })

  loadTemperatureUnit()
  resolveMyLocation()
})

const footerTimestamp = computed(() => now.value.toLocaleDateString('zh-TW', {
  year: 'numeric', month: 'long', day: 'numeric'
}) + ' ' + now.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))

// Before GPS/a remembered city resolves, there's no real location to show yet —
// say so instead of rendering blank text.
const footerLocationLabel = computed(() => {
  const county = myLocation.value?.county_name ?? selectedCounty.value
  const township = myLocation.value?.township_name ?? selectedTownship.value
  return county && township ? `${county} ${township}, 台灣` : '尚未定位'
})
</script>

<template>
  <div class="bg-gradient-weather min-h-screen flex flex-col text-on-surface font-body-md antialiased overflow-x-hidden">
    <header class="sticky top-0 z-50 bg-surface-container-lowest/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-14 md:h-16 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-lg">
          <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(0,97,148,0.25)]">
              <span class="material-symbols-outlined text-on-primary text-[20px] md:text-[22px]">air</span>
            </div>
            <h1 class="hidden sm:block font-headline-sm text-headline-sm text-primary font-bold tracking-tight">AeroPulse</h1>
          </NuxtLink>

          <nav class="hidden md:flex items-center gap-space-xs bg-surface-container-low p-1 rounded-full">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :title="item.label"
              class="flex items-center px-space-sm lg:px-space-md py-1.5 rounded-full font-title-sm text-title-sm transition-all whitespace-nowrap"
              :class="item.active
                ? 'bg-secondary-fixed text-on-secondary-fixed'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'"
            >
              <span class="material-symbols-outlined text-[20px] lg:hidden">{{ item.icon }}</span>
              <span class="hidden lg:inline">{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-space-sm md:gap-space-md min-w-0">
          <LocationPicker />

          <div class="flex items-center bg-surface-container-low p-0.5 rounded-full" role="group" aria-label="溫度單位">
            <button
              v-for="option in (['C', 'F'] as const)"
              :key="option"
              type="button"
              class="px-2.5 py-0.5 rounded-full font-label-md text-label-md transition-colors"
              :class="unit === option ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
              :aria-pressed="unit === option"
              @click="setUnit(option)"
            >
              °{{ option }}
            </button>
          </div>

          <NuxtLink
            to="/saved-cities"
            aria-label="已儲存城市"
            title="已儲存城市"
            class="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">bookmarks</span>
          </NuxtLink>

        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-space-lg md:pt-space-xl pb-28 md:pb-16">
      <slot />
    </main>

    <footer class="hidden md:block w-full bg-surface-container-low shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
      <div class="max-w-container-max mx-auto px-margin-desktop py-space-xl flex flex-col gap-space-md text-on-surface-variant">
        <div class="flex flex-col lg:flex-row items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-primary text-[20px]">cloud_done</span>
            <span class="font-title-sm text-title-sm text-on-surface">資料來源：交通部中央氣象署 (CWA)、環境部空氣品質監測</span>
          </div>
          <div class="flex items-center gap-space-lg font-body-sm text-body-sm">
            <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="hover:text-primary transition-colors">{{ item.label }}</NuxtLink>
          </div>
        </div>
        <div class="flex items-center justify-between gap-space-md font-label-md text-label-md text-outline">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">location_on</span>
            {{ footerLocationLabel }}
          </span>
          <span>© {{ now.getFullYear() }} AeroPulse</span>
          <ClientOnly>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              {{ footerTimestamp }}
            </span>
          </ClientOnly>
        </div>
      </div>
    </footer>

    <!-- Bottom nav (mobile) -->
    <nav class="md:hidden fixed bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.05)] z-50 flex justify-around py-2 px-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center px-3 py-1 rounded-xl"
        :class="item.active ? 'text-primary bg-secondary-fixed/60' : 'text-on-surface-variant'"
      >
        <span class="material-symbols-outlined" :style="item.active ? { fontVariationSettings: '\'FILL\' 1' } : {}">{{ item.icon }}</span>
        <span class="font-label-sm text-[10px] mt-0.5">{{ item.mobileLabel ?? item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
