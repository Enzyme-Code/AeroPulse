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

    if (selectedGeocode.value) return

    if (!hasTriedGeolocation.value) {
      hasTriedGeolocation.value = true
      locatingByGps.value = true
      const coords = await getCurrentCoords()
      const nearest = coords ? findNearestCity(coords, cities.value) : null
      locatingByGps.value = false

      if (nearest) {
        selectedCounty.value = nearest.county_name
        selectedTownship.value = nearest.township_name
        selectedGeocode.value = nearest.geocode
        return
      }
    }

    applyFallbackDefault()
  }

  function selectCity(city: City) {
    selectedCounty.value = city.county_name
    selectedTownship.value = city.township_name
    selectedGeocode.value = city.geocode
  }

  return { cities, selectedCounty, selectedTownship, selectedGeocode, locatingByGps, ensureCitiesLoaded, selectCity }
}
