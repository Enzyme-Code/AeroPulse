interface SavedCity {
  geocode: string
  county_name: string
  township_name: string
}

const STORAGE_KEY = 'aeropulse:saved-cities'

const DEFAULT_SAVED_CITIES: SavedCity[] = [
  { geocode: '63000010', county_name: '臺北市', township_name: '松山區' },
  { geocode: '66000010', county_name: '臺中市', township_name: '中區' },
  { geocode: '64000010', county_name: '高雄市', township_name: '鹽埕區' },
  { geocode: '68000010', county_name: '桃園市', township_name: '桃園區' },
  { geocode: '67000010', county_name: '臺南市', township_name: '新營區' },
  { geocode: '10018010', county_name: '新竹市', township_name: '東區' }
]

export function useSavedCities() {
  const savedCities = useState<SavedCity[]>('savedCities', () => [])
  const loaded = useState('savedCitiesLoaded', () => false)

  function load() {
    if (loaded.value) return
    loaded.value = true

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      savedCities.value = DEFAULT_SAVED_CITIES
      return
    }

    try {
      savedCities.value = JSON.parse(raw)
    } catch {
      savedCities.value = DEFAULT_SAVED_CITIES
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCities.value))
  }

  function addCity(city: SavedCity) {
    if (savedCities.value.some(c => c.geocode === city.geocode)) return
    savedCities.value = [...savedCities.value, city]
    persist()
  }

  function removeCity(geocode: string) {
    savedCities.value = savedCities.value.filter(c => c.geocode !== geocode)
    persist()
  }

  return { savedCities, load, addCity, removeCity }
}
