export interface ThirtySixHourBlock {
  county_name: string
  start_time: string
  end_time: string
  wx_text: string | null
  pop: number | null
  min_temp: number | null
  max_temp: number | null
  ci_text: string | null
  weather_description: string | null
}

export interface HourlyRow {
  geocode: string
  data_time: string
  wx_text: string | null
  pop: string | null
  temp: string | null
  dew_point: string | null
  humidity: string | null
  apparent_temp: string | null
  comfort_index: string | null
  wind_direction: string | null
  wind_speed: string | null
  weather_description: string | null
}

export interface WeeklyRow {
  geocode: string
  start_time: string
  end_time: string
  wx_text: string | null
  pop: string | null
  avg_temp: string | null
  min_temp: string | null
  max_temp: string | null
  avg_dew_point: string | null
  avg_humidity: string | null
  wind_direction: string | null
  wind_speed: string | null
  max_apparent_temp: string | null
  min_apparent_temp: string | null
  max_comfort_index: string | null
  min_comfort_index: string | null
  uv_index: string | null
  weather_description: string | null
}

interface Station {
  siteid: number
  sitename: string
  country: string
  longitude: number
  latitude: number
}

export interface Pollution {
  siteid: number
  sitename: string
  country: string
  aqi: number | null
  status: string | null
  pollutant: string | null
  so2: string | null
  co: string | null
  o3: string | null
  o3_8hr: string | null
  pm10: number | null
  pm2_5: string | null
  no2: string | null
  nox: string | null
  no: string | null
  co_8hr: string | null
  wind_speed: string | null
  wind_direc: string | null
  pm2_5_avg: string | null
  pm10_avg: string | null
  so2_avg: string | null
}

// UV index is only published for one daytime block per day; nearby blocks can be null, so
// search among blocks that actually have a reading rather than whichever block covers "now".
function currentWeeklyBlock(rows: WeeklyRow[]): WeeklyRow | null {
  const withUv = rows.filter(r => r.uv_index != null)
  return closestByTime(withUv, 'start_time')
}

// Module-level so every caller shares one counter — a load() from any component
// invalidates whichever request was in flight before it.
let requestId = 0

// Forecast + air quality for whichever city useCitySelection() currently has selected.
// Kept in useState so the page that triggers load() and the dashboard components that
// render it all read the same data without prop-drilling every series.
export function useLocationWeather() {
  const { cities, selectedCounty, selectedGeocode } = useCitySelection()

  const thirtySixHour = useState<ThirtySixHourBlock[]>('lw:36hour', () => [])
  const hourly = useState<HourlyRow[]>('lw:hourly', () => [])
  const weekly = useState<WeeklyRow[]>('lw:weekly', () => [])
  const pollution = useState<Pollution | null>('lw:pollution', () => null)
  const loading = useState('lw:loading', () => true)
  const loadedGeocode = useState('lw:geocode', () => '')
  // ms timestamp of the last successful load; 0 until the first one finishes.
  const lastUpdated = useState('lw:lastUpdated', () => 0)

  // `silent` is for background refreshes of the same city: the current data stays on
  // screen (no loading state) and a failed refresh just keeps it, instead of erroring.
  async function load({ silent = false } = {}) {
    if (!selectedCounty.value || !selectedGeocode.value) return

    if (silent) {
      try {
        await fetchAndApply()
      } catch {
        // Keep showing the previous data; the next refresh tick will try again.
      }
      return
    }

    loading.value = true
    await fetchAndApply()
  }

  async function fetchAndApply() {
    const id = ++requestId
    const county = selectedCounty.value
    const geocode = selectedGeocode.value

    const [b36, hourlyRows, weeklyRows, stations] = await Promise.all([
      $fetch<ThirtySixHourBlock[]>('/api/weather/36hour', { query: { county } }),
      $fetch<HourlyRow[]>('/api/weather/forecast-three-days', { query: { geocode } }),
      $fetch<WeeklyRow[]>('/api/weather/forecast-one-week', { query: { geocode } }),
      $fetch<Station[]>('/api/air/stations', { query: { country: county } })
    ])

    // Stations are only filtered down to the selected county, so still pick whichever one is
    // actually nearest to the selected township — otherwise every township in the county would
    // show the same (alphabetically-first) station.
    const currentCity = cities.value.find(c => c.geocode === geocode)
    const nearestStation = currentCity
      ? findNearestCity({ lat: currentCity.latitude, lng: currentCity.longitude }, stations)
      : (stations[0] ?? null)

    const pollutionRow = nearestStation
      ? (await $fetch<Pollution[]>('/api/air/pollution', { query: { siteId: nearestStation.siteid } }))[0] ?? null
      : null

    // A newer selection started while this one was in flight; drop the stale result.
    if (id !== requestId) return

    thirtySixHour.value = b36
    hourly.value = hourlyRows
    weekly.value = weeklyRows
    pollution.value = pollutionRow
    loadedGeocode.value = geocode
    lastUpdated.value = Date.now()
    loading.value = false
  }

  const filledHourly = computed(() => fillForwardHourly(hourly.value))
  const heroBlock = computed(() => currentBlock(thirtySixHour.value))
  const heroHour = computed(() => closestByTime(filledHourly.value, 'data_time'))
  const heroUv = computed(() => currentWeeklyBlock(weekly.value))
  const heroWeekly = computed(() => closestByTime(weekly.value, 'start_time'))

  const upcomingHours = computed(() => {
    const now = Date.now()
    return filledHourly.value.filter(r => new Date(r.data_time).getTime() >= now - 30 * 60 * 1000).slice(0, 24)
  })

  return {
    thirtySixHour,
    hourly,
    weekly,
    pollution,
    loading,
    loadedGeocode,
    lastUpdated,
    load,
    filledHourly,
    heroBlock,
    heroHour,
    heroUv,
    heroWeekly,
    upcomingHours
  }
}
