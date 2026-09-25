import type { ThirtySixHourBlock } from './useLocationWeather'

interface OverviewPollutionRow {
  country: string
  aqi: number | null
}

export type Region = '北部' | '中部' | '南部' | '東部' | '離島'

export const REGIONS: Region[] = ['北部', '中部', '南部', '東部', '離島']

// 國發會 region grouping; 宜蘭 counts as 北部 there, and the three offshore counties get
// their own bucket since they'd otherwise dominate neither north nor south meaningfully.
const COUNTY_REGION: Record<string, Region> = {
  臺北市: '北部', 新北市: '北部', 基隆市: '北部', 桃園市: '北部', 新竹市: '北部', 新竹縣: '北部', 宜蘭縣: '北部',
  苗栗縣: '中部', 臺中市: '中部', 彰化縣: '中部', 南投縣: '中部', 雲林縣: '中部',
  嘉義市: '南部', 嘉義縣: '南部', 臺南市: '南部', 高雄市: '南部', 屏東縣: '南部',
  花蓮縣: '東部', 臺東縣: '東部',
  澎湖縣: '離島', 金門縣: '離島', 連江縣: '離島'
}

export function countyRegion(county: string): Region | null {
  return COUNTY_REGION[county] ?? null
}

// Every county's current 36-hour block plus its averaged station AQI. Loaded once and
// cached in useState, since both the home dashboard and /overview render it.
export function useCountyOverview() {
  const blocks = useState<ThirtySixHourBlock[]>('overview:blocks', () => [])
  const pollution = useState<OverviewPollutionRow[]>('overview:pollution', () => [])
  const loading = useState('overview:loading', () => true)
  const loaded = useState('overview:loaded', () => false)
  const lastUpdated = useState('overview:lastUpdated', () => 0)
  let refreshing = false

  async function fetchAndApply() {
    const [blockRows, pollutionRows] = await Promise.all([
      $fetch<ThirtySixHourBlock[]>('/api/weather/36hour'),
      $fetch<OverviewPollutionRow[]>('/api/air/pollution')
    ])

    blocks.value = blockRows
    pollution.value = pollutionRows
    lastUpdated.value = Date.now()
  }

  async function ensureLoaded() {
    if (loaded.value) return
    loaded.value = true
    loading.value = true
    await fetchAndApply()
    loading.value = false
  }

  // Background refresh: keeps the current rows on screen, and on failure keeps them too.
  async function refresh() {
    if (refreshing) return
    refreshing = true
    try {
      await fetchAndApply()
    } catch {
      // Keep the previous rows; the next refresh tick will try again.
    } finally {
      refreshing = false
    }
  }

  const aqiByCounty = computed(() => {
    const grouped = new Map<string, number[]>()
    for (const row of pollution.value) {
      if (row.aqi == null) continue
      const list = grouped.get(row.country) ?? []
      list.push(row.aqi)
      grouped.set(row.country, list)
    }

    const averages = new Map<string, number>()
    for (const [county, values] of grouped) {
      averages.set(county, Math.round(values.reduce((sum, v) => sum + v, 0) / values.length))
    }
    return averages
  })

  const rows = computed(() => {
    const grouped = new Map<string, ThirtySixHourBlock[]>()
    for (const row of blocks.value) {
      const list = grouped.get(row.county_name) ?? []
      list.push(row)
      grouped.set(row.county_name, list)
    }
    return Array.from(grouped.entries()).map(([county, countyRows]) => ({
      county,
      region: countyRegion(county),
      block: currentBlock(countyRows),
      aqi: aqiByCounty.value.get(county) ?? null
    }))
  })

  return { rows, loading, lastUpdated, ensureLoaded, refresh }
}
