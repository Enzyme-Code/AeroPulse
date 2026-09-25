<script setup lang="ts">
interface CityRef {
  geocode: string
  county_name: string
  township_name: string
}

// Header location button + dropdown (county/township, GPS). On the home page a pick
// switches the dashboard in place; anywhere else it opens that city's /weather/... page.
const route = useRoute()
const router = useRouter()

const { cities, selectedCounty, selectedTownship, selectedGeocode, locatingByGps, ensureCitiesLoaded, ensureLocationResolved, selectCity } = useCitySelection()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const draftCounty = ref('')
const draftTownship = ref('')

watch([selectedCounty, selectedTownship], ([county, township]) => {
  draftCounty.value = county
  draftTownship.value = township
}, { immediate: true })

const countyOptions = computed(() => Array.from(new Set(cities.value.map(c => c.county_name))))
const townshipOptions = computed(() =>
  cities.value.filter(c => c.county_name === draftCounty.value).map(c => c.township_name)
)

function goTo(city: CityRef) {
  open.value = false
  if (route.path === '/') {
    selectCity(city)
    return
  }
  router.push(`/weather/${encodeURIComponent(city.county_name)}/${encodeURIComponent(city.township_name)}`)
}

function commitDraftSelection() {
  const match = cities.value.find(c => c.county_name === draftCounty.value && c.township_name === draftTownship.value)
  if (match) goTo(match)
}

// Picking a county only narrows the township list; nothing switches until a township is
// chosen too, so changing both levels is still a single location change.
function onCountyChange() {
  draftTownship.value = ''
}

// Reopening after picking only a county shouldn't leave that half-finished choice behind.
watch(open, (isOpen) => {
  if (!isOpen) return
  draftCounty.value = selectedCounty.value
  draftTownship.value = selectedTownship.value
})

const locationError = ref(false)
let locationErrorTimer: ReturnType<typeof setTimeout> | undefined

async function locateMe() {
  const resolved = await ensureLocationResolved(true)
  if (!resolved) {
    locationError.value = true
    clearTimeout(locationErrorTimer)
    locationErrorTimer = setTimeout(() => { locationError.value = false }, 4000)
    return
  }
  goTo({ geocode: selectedGeocode.value, county_name: selectedCounty.value, township_name: selectedTownship.value })
}

function onDocumentClick(event: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  ensureCitiesLoaded()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  clearTimeout(locationErrorTimer)
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-space-xs bg-surface-container-low pl-space-sm pr-space-sm md:pl-space-md py-1.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <span class="material-symbols-outlined text-[18px] text-primary" :class="{ 'animate-pulse': locatingByGps }">location_on</span>
      <ClientOnly>
        <span class="font-title-sm text-title-sm whitespace-nowrap max-w-[7.5rem] sm:max-w-none truncate">
          {{ selectedCounty && selectedTownship ? `${selectedCounty} ${selectedTownship}` : '選擇地點' }}
        </span>
        <template #fallback>
          <span class="font-title-sm text-title-sm whitespace-nowrap">選擇地點</span>
        </template>
      </ClientOnly>
      <span class="material-symbols-outlined text-[16px] transition-transform" :class="{ 'rotate-180': open }">expand_more</span>
    </button>

    <div
      v-if="open"
      role="dialog"
      aria-label="選擇地點"
      class="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(19,27,46,0.14)] p-space-lg flex flex-col gap-space-md z-50"
    >
      <div class="flex flex-col gap-space-sm">
        <label class="flex flex-col gap-1">
          <span class="font-label-md text-label-md text-outline">縣市</span>
          <select
            v-model="draftCounty"
            class="w-full bg-surface-container-low rounded-xl px-space-md py-2 font-title-sm text-title-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer"
            @change="onCountyChange"
          >
            <option v-if="!draftCounty" value="" disabled>選擇縣市</option>
            <option v-for="county in countyOptions" :key="county" :value="county">{{ county }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-label-md text-label-md text-outline">行政區</span>
          <select
            v-model="draftTownship"
            class="w-full bg-surface-container-low rounded-xl px-space-md py-2 font-title-sm text-title-sm text-on-surface focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-50"
            :class="draftCounty && !draftTownship ? 'ring-2 ring-primary-fixed-dim' : 'focus:ring-primary-fixed-dim'"
            :disabled="!draftCounty"
            @change="commitDraftSelection"
          >
            <option value="" disabled>選擇行政區</option>
            <option v-for="township in townshipOptions" :key="township" :value="township">{{ township }}</option>
          </select>
        </label>
      </div>

      <div class="flex items-center">
        <button
          class="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors"
          type="button"
          @click="locateMe"
        >
          <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-pulse': locatingByGps }">my_location</span>
          <span class="font-label-md text-label-md">目前定位</span>
        </button>
      </div>

      <p v-if="locationError" class="font-body-sm text-body-sm text-error">無法定位，請手動選擇地區</p>
    </div>
  </div>
</template>
