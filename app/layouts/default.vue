<script setup lang="ts">
const route = useRoute()

const navItems = computed(() => [
  { label: '首頁', icon: 'dashboard', to: '/' },
  { label: '氣象地圖', icon: 'map', to: '/map' },
  { label: '已儲存城市', icon: 'location_city', to: '/saved-cities' },
  { label: '設定', icon: 'settings', to: '/settings' }
].map(item => ({ ...item, active: route.path === item.to })))

const { cities, selectedCounty, selectedTownship, selectCity, ensureCitiesLoaded } = useCitySelection()

const now = ref(new Date())
onMounted(() => {
  const timer = setInterval(() => { now.value = new Date() }, 1_000)
  onUnmounted(() => clearInterval(timer))
})

const footerTimestamp = computed(() => now.value.toLocaleDateString('zh-TW', {
  year: 'numeric', month: 'long', day: 'numeric'
}) + ' ' + now.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))

const searchQuery = ref('')
const isSearchFocused = ref(false)

const searchResults = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return []

  return cities.value
    .filter(c => c.county_name.includes(query) || c.township_name.includes(query))
    .slice(0, 8)
})

function pickCity(city: (typeof cities.value)[number]) {
  selectCity(city)
  searchQuery.value = ''
  isSearchFocused.value = false
}

function handleSearchBlur() {
  // delay so a click on a dropdown item registers before the list unmounts
  setTimeout(() => { isSearchFocused.value = false }, 150)
}

onMounted(ensureCitiesLoaded)
</script>

<template>
  <div class="bg-gradient-weather min-h-screen flex flex-col text-on-surface font-body-md overflow-x-hidden">
    <!-- Top app bar (desktop): logo, nav links, search and actions in one centered row -->
    <header class="bg-surface/60 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm sticky top-0 hidden md:flex z-40">
      <div class="flex items-center w-full h-16 px-margin-desktop max-w-container-max mx-auto gap-6">
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">partly_cloudy_day</span>
          </div>
          <h1 class="font-headline-md text-headline-md text-primary">AeroPulse</h1>
        </NuxtLink>

        <nav class="flex items-center gap-1 shrink-0">
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

        <div class="relative flex-1 max-w-xs">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋城市..."
            class="w-full pl-10 pr-4 py-2 rounded-full glass-card border-none focus:ring-2 focus:ring-primary-fixed-dim bg-white/40 text-on-surface font-body-md text-body-md placeholder-on-surface-variant/50"
            @focus="isSearchFocused = true"
            @blur="handleSearchBlur"
          >

          <ul
            v-if="isSearchFocused && searchResults.length"
            class="absolute top-full mt-2 w-full glass-card rounded-lg overflow-hidden z-50 max-h-72 overflow-y-auto"
          >
            <li
              v-for="city in searchResults"
              :key="city.geocode"
              class="px-4 py-2 hover:bg-primary/10 cursor-pointer text-body-md text-on-surface"
              @mousedown.prevent="pickCity(city)"
            >
              {{ city.county_name }} {{ city.township_name }}
            </li>
          </ul>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <NuxtLink
            to="/saved-cities"
            class="bg-primary text-on-primary px-4 py-2 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            新增城市
          </NuxtLink>
          <button class="text-on-surface-variant hover:text-on-surface p-2 rounded-full transition-colors">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="text-on-surface-variant hover:text-on-surface p-2 rounded-full transition-colors">
            <span class="material-symbols-outlined">dark_mode</span>
          </button>
          <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span class="material-symbols-outlined text-lg">person</span>
          </div>
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
          {{ selectedCounty }} {{ selectedTownship }}, 台灣
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
