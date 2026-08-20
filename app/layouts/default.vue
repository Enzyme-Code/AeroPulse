<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const navItems = computed(() => [
  { label: '首頁', icon: 'dashboard', to: '/' },
  { label: '氣象地圖', icon: 'map', to: '/map' },
  { label: '已儲存城市', icon: 'location_city', to: '/saved-cities' }
].map(item => ({ ...item, active: route.path === item.to })))

const { selectedCounty, selectedTownship, locatingByGps, forceRelocate, myLocation, resolveMyLocation } = useCitySelection()
const { viewMode } = useViewMode()

function locateMeAndShowDetail() {
  forceRelocate.value = true
  viewMode.value = 'detail'
  router.push('/')
}

const now = ref(new Date())
onMounted(() => {
  const timer = setInterval(() => { now.value = new Date() }, 1_000)
  onUnmounted(() => clearInterval(timer))

  resolveMyLocation()
})

const footerTimestamp = computed(() => now.value.toLocaleDateString('zh-TW', {
  year: 'numeric', month: 'long', day: 'numeric'
}) + ' ' + now.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
</script>

<template>
  <div class="bg-gradient-weather min-h-screen flex flex-col text-on-surface font-body-md overflow-x-hidden">
    <!-- Top app bar (mobile): just the logo, so the screen doesn't feel empty above the content -->
    <header class="bg-surface/60 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm sticky top-0 flex md:hidden z-40">
      <div class="flex items-center justify-between w-full h-14 px-margin-mobile">
        <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity" @click="viewMode = 'overview'">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-lg" style="font-variation-settings: 'FILL' 1">partly_cloudy_day</span>
          </div>
          <h1 class="font-headline-md text-headline-md text-primary">AeroPulse</h1>
        </NuxtLink>
        <button
          class="text-on-surface-variant hover:text-on-surface p-2 rounded-full transition-colors"
          title="偵測目前位置"
          @click="locateMeAndShowDetail"
        >
          <span class="material-symbols-outlined" :class="{ 'animate-pulse text-primary': locatingByGps }">my_location</span>
        </button>
      </div>
    </header>

    <!-- Top app bar (desktop): logo, nav links, search and actions in one centered row -->
    <header class="bg-surface/60 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm sticky top-0 hidden md:flex z-40">
      <div class="relative flex items-center w-full h-16 px-margin-desktop max-w-container-max mx-auto gap-6">
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity" @click="viewMode = 'overview'">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">partly_cloudy_day</span>
          </div>
          <h1 class="font-headline-md text-headline-md text-primary">AeroPulse</h1>
        </NuxtLink>

        <nav class="flex items-center gap-1 shrink-0 absolute left-1/2 -translate-x-1/2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-2 px-3 py-2 rounded-full transition-colors"
            :class="item.active
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container'"
          >
            <span class="material-symbols-outlined text-lg" :style="item.active ? { fontVariationSettings: '\'FILL\' 1' } : {}">{{ item.icon }}</span>
            <span class="hidden xl:inline font-body-md text-body-md">{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3 ml-auto shrink-0">
          <button
            class="p-2 rounded-full transition-colors"
            :class="viewMode === 'detail' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-on-surface'"
            title="偵測目前位置並查看詳細資訊"
            @click="locateMeAndShowDetail"
          >
            <span class="material-symbols-outlined" :class="{ 'animate-pulse': locatingByGps }">my_location</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content: centered, no sidebar offset -->
    <main class="flex-1 w-full p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-section-gap pb-24 md:pb-margin-desktop">
      <slot />
    </main>

    <!-- Footer (desktop): current city, copyright, live timestamp -->
    <footer class="hidden md:block w-full bg-surface-container-low border-t border-outline-variant/30 py-6 px-margin-desktop">
      <div class="max-w-container-max mx-auto flex items-center justify-between gap-4 text-on-surface-variant font-label-sm text-label-sm">
        <div class="flex-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[16px]">location_on</span>
          {{ myLocation?.county_name ?? selectedCounty }} {{ myLocation?.township_name ?? selectedTownship }}, 台灣
        </div>
        <div class="flex-1 text-center">
          © {{ now.getFullYear() }} AeroPulse. All rights reserved.
        </div>
        <ClientOnly>
          <div class="flex-1 flex items-center justify-end gap-2">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            {{ footerTimestamp }}
          </div>
        </ClientOnly>
      </div>
    </footer>

    <!-- Bottom nav (mobile) -->
    <nav class="md:hidden fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-outline-variant/20 z-50 flex justify-around py-3 px-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="flex flex-col items-center"
        :class="item.active ? 'text-primary-fixed-dim' : 'text-on-surface-variant'"
      >
        <span class="material-symbols-outlined" :style="item.active ? { fontVariationSettings: '\'FILL\' 1' } : {}">{{ item.icon }}</span>
        <span class="font-label-sm text-[10px] mt-1">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
