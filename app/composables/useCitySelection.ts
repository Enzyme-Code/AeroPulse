interface City {
  id: number
  geocode: string
  county_name: string
  township_name: string
  longitude: number
  latitude: number
}

const LAST_CITY_STORAGE_KEY = 'aeropulse:last-city'

export function useCitySelection() {
  const cities = useState<City[]>('cities', () => [])
  // No hardcoded city default: until GPS or a remembered city resolves one, these
  // stay empty and callers show a "pick a location" state instead of a fake default.
  const selectedCounty = useState('selectedCounty', () => '')
  const selectedTownship = useState('selectedTownship', () => '')
  const selectedGeocode = useState('selectedGeocode', () => '')
  const hasTriedGeolocation = useState('hasTriedGeolocation', () => false)
  const locatingByGps = useState('locatingByGps', () => false)

  // The footer's "you are here" indicator: the user's actual GPS position, kept separate
  // from selectedCounty/selectedTownship (which track whichever city is being viewed in
  // the dashboard, e.g. via the county/township dropdowns) so browsing elsewhere never
  // changes what the footer reports.
  const myLocation = useState<{ county_name: string, township_name: string } | null>('myLocation', () => null)
  const myLocationLoading = useState('myLocationLoading', () => false)

  // Falls back to whichever city the user last viewed (remembered in localStorage),
  // rather than a hardcoded city, since that's still the most relevant guess when
  // GPS is unavailable. Returns whether a city was applied.
  function applyLastVisitedCity(): boolean {
    const geocode = localStorage.getItem(LAST_CITY_STORAGE_KEY)
    const match = geocode ? cities.value.find(c => c.geocode === geocode) : undefined
    if (!match) return false

    selectedCounty.value = match.county_name
    selectedTownship.value = match.township_name
    selectedGeocode.value = match.geocode
    return true
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
      localStorage.setItem(LAST_CITY_STORAGE_KEY, nearest.geocode)
    }

    return nearest != null
  }

  // Only call this when the user actually opens a location-specific view — geolocation
  // should never fire just because the app loaded. Pass force to re-run GPS even if a
  // location is already selected (the navbar's "use my location" button).
  // Returns whether a location ended up resolved (GPS, remembered city, or already set) —
  // callers should show a "pick a location" state rather than navigate when this is false.
  async function ensureLocationResolved(force = false): Promise<boolean> {
    await ensureCitiesLoaded()

    if (selectedGeocode.value && !force) return true

    if (force || !hasTriedGeolocation.value) {
      hasTriedGeolocation.value = true
      if (await resolveByGps()) return true
    }

    return applyLastVisitedCity()
  }

  function selectCity(city: Pick<City, 'geocode' | 'county_name' | 'township_name'>) {
    selectedCounty.value = city.county_name
    selectedTownship.value = city.township_name
    selectedGeocode.value = city.geocode
    localStorage.setItem(LAST_CITY_STORAGE_KEY, city.geocode)
  }

  // Best-effort, silent GPS lookup for the footer only — does not touch the viewed
  // selection. Safe to call on every layout mount: it's a no-op once resolved (or once a
  // lookup is already in flight), so it only ever prompts for permission once per session.
  async function resolveMyLocation() {
    if (myLocation.value || myLocationLoading.value) return

    myLocationLoading.value = true
    await ensureCitiesLoaded()
    const coords = await getCurrentCoords()
    const nearest = coords ? findNearestCity(coords, cities.value) : null
    if (nearest) {
      myLocation.value = { county_name: nearest.county_name, township_name: nearest.township_name }
    }
    myLocationLoading.value = false
  }

  return {
    cities,
    selectedCounty,
    selectedTownship,
    selectedGeocode,
    locatingByGps,
    myLocation,
    myLocationLoading,
    ensureCitiesLoaded,
    ensureLocationResolved,
    resolveMyLocation,
    selectCity
  }
}
