interface City {
  id: number
  geocode: string
  county_name: string
  township_name: string
  longitude: number
  latitude: number
}

export function useCitySelection() {
  const cities = useState<City[]>('cities', () => [])
  const selectedCounty = useState('selectedCounty', () => '臺北市')
  const selectedTownship = useState('selectedTownship', () => '大安區')
  const selectedGeocode = useState('selectedGeocode', () => '')
  const hasTriedGeolocation = useState('hasTriedGeolocation', () => false)
  const locatingByGps = useState('locatingByGps', () => false)

  // Set by the navbar's "use my location" button before it navigates to the detail view;
  // loadDetailData reads and clears it so the single ensureLocationResolved call that
  // already runs on entering detail view does the (forced) GPS lookup, instead of a
  // second call racing it.
  const forceRelocate = useState('forceRelocate', () => false)

  function applyFallbackDefault() {
    const match = cities.value.find(
      c => c.county_name === selectedCounty.value && c.township_name === selectedTownship.value
    ) ?? cities.value.find(c => c.county_name === selectedCounty.value)

    if (match) {
      selectedCounty.value = match.county_name
      selectedTownship.value = match.township_name
      selectedGeocode.value = match.geocode
    }
  }

  async function ensureCitiesLoaded() {
    if (cities.value.length === 0) {
      cities.value = await $fetch<City[]>('/api/cities')
    }
  }

  async function resolveByGps(): Promise<boolean> {
    locatingByGps.value = true
    const coords = await getCurrentCoords()
    const nearest = coords ? findNearestCity(coords, cities.value) : null
    locatingByGps.value = false

    if (nearest) {
      selectedCounty.value = nearest.county_name
      selectedTownship.value = nearest.township_name
      selectedGeocode.value = nearest.geocode
    }

    return nearest != null
  }

  // Only call this when the user actually opens a location-specific view — geolocation
  // should never fire just because the app loaded. Pass force to re-run GPS even if a
  // location is already selected (the navbar's "use my location" button).
  async function ensureLocationResolved(force = false) {
    await ensureCitiesLoaded()

    if (selectedGeocode.value && !force) return

    if (force || !hasTriedGeolocation.value) {
      hasTriedGeolocation.value = true
      if (await resolveByGps()) return
    }

    applyFallbackDefault()
  }

  function selectCity(city: Pick<City, 'geocode' | 'county_name' | 'township_name'>) {
    selectedCounty.value = city.county_name
    selectedTownship.value = city.township_name
    selectedGeocode.value = city.geocode
  }

  return {
    cities,
    selectedCounty,
    selectedTownship,
    selectedGeocode,
    locatingByGps,
    forceRelocate,
    ensureCitiesLoaded,
    ensureLocationResolved,
    selectCity
  }
}
