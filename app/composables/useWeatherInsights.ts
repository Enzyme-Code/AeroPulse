import type { HourlyRow, Pollution, ThirtySixHourBlock, WeeklyRow } from './useLocationWeather'

function num(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function maxOf(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null)
  return present.length ? Math.max(...present) : null
}

function minOf(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null)
  return present.length ? Math.min(...present) : null
}

// CWA 紫外線指數分級
export function uvLevel(index: number | null): { name: string, colorClass: string } | null {
  if (index == null) return null
  if (index <= 2) return { name: '低量級', colorClass: 'text-tertiary' }
  if (index <= 5) return { name: '中量級', colorClass: 'text-secondary' }
  if (index <= 7) return { name: '高量級', colorClass: 'text-error' }
  if (index <= 10) return { name: '過量級', colorClass: 'text-error' }
  return { name: '危險級', colorClass: 'text-error' }
}

export function humidityCaption(humidity: number | null): string | undefined {
  if (humidity == null) return undefined
  if (humidity < 40) return '偏乾燥 (舒適 40–70%)'
  if (humidity <= 70) return '舒適範圍 40–70%'
  return '偏潮濕 (舒適 40–70%)'
}

export function dewPointCaption(dewPoint: number | null): string | undefined {
  if (dewPoint == null) return undefined
  if (dewPoint >= 24) return '水氣充沛，體感悶熱'
  if (dewPoint >= 18) return '略感潮濕'
  return '空氣乾爽'
}

export interface WeeklyDay {
  date: string
  label: string
  icon: string
  min: number | null
  max: number | null
  pop: number | null
}

// The one-week forecast comes as 12-hour day/night blocks; collapse them into one row per
// calendar day: widest temp range, the higher of the two PoPs, and the daytime block's icon.
export function groupWeeklyByDay(rows: WeeklyRow[], limit = 7): WeeklyDay[] {
  // The API can still return blocks that already ended; skip those so the list starts today.
  const now = Date.now()
  const upcoming = rows
    .filter(r => new Date(r.end_time).getTime() > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const byDate = new Map<string, WeeklyRow[]>()
  for (const row of upcoming) {
    const d = new Date(row.start_time)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const list = byDate.get(key) ?? []
    list.push(row)
    byDate.set(key, list)
  }

  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  })()

  return Array.from(byDate.entries()).slice(0, limit).map(([key, dayRows]) => {
    const first = new Date(dayRows[0].start_time)
    const daytime = dayRows.find((r) => {
      const h = new Date(r.start_time).getHours()
      return h >= 6 && h < 18
    }) ?? dayRows[0]

    return {
      date: key,
      label: key === todayKey ? '今天' : first.toLocaleDateString('zh-TW', { weekday: 'short' }),
      icon: weatherIcon(daytime.wx_text, new Date(daytime.start_time)),
      min: minOf(dayRows.map(r => num(r.min_temp))),
      max: maxOf(dayRows.map(r => num(r.max_temp))),
      pop: maxOf(dayRows.map(r => num(r.pop)))
    }
  })
}

export interface LifestyleTip {
  icon: string
  iconClass: string
  title: string
  text: string
}

interface TipInputs {
  heroHour: HourlyRow | null
  heroBlock: ThirtySixHourBlock | null
  upcomingHours: HourlyRow[]
  weekly: WeeklyRow[]
  uvIndex: number | null
  pollution: Pollution | null
}

// Rule-of-thumb suggestions derived from the forecast already on screen — not an
// official CWA index, so keep the thresholds simple and conservative.
export function lifestyleTips({ heroHour, heroBlock, upcomingHours, weekly, uvIndex, pollution }: TipInputs): LifestyleTip[] {
  const apparent = num(heroHour?.apparent_temp) ?? num(heroHour?.temp)
  const next12hPop = maxOf([num(heroBlock?.pop), ...upcomingHours.slice(0, 12).map(h => num(h.pop))])
  const next48hPop = maxOf(weekly.slice(0, 4).map(r => num(r.pop)))
  const aqi = pollution?.aqi ?? null

  let clothing = '--'
  if (apparent != null) {
    if (apparent >= 30) clothing = uvIndex != null && uvIndex >= 6 ? '短袖輕便、注意防曬' : '短袖輕便為主'
    else if (apparent >= 26) clothing = '短袖或薄長袖'
    else if (apparent >= 20) clothing = '薄長袖或薄外套'
    else if (apparent >= 15) clothing = '長袖加外套'
    else clothing = '厚外套注意保暖'
  }

  let umbrella = '--'
  if (next12hPop != null) {
    if (next12hPop >= 60) umbrella = '降雨機率高，務必帶傘'
    else if (next12hPop >= 30) umbrella = '建議攜帶折傘'
    else umbrella = '降雨機率低，免帶傘'
  }

  let carWash = '--'
  if (next48hPop != null) {
    if (next48hPop < 30) carWash = '適宜，近兩天少雨'
    else if (next48hPop < 60) carWash = '較不適宜，可能降雨'
    else carWash = '不宜，降雨機率高'
  }

  let exercise = '適宜戶外活動'
  if (aqi != null && aqi > 100) exercise = '空品不佳，減少戶外活動'
  else if (next12hPop != null && next12hPop >= 60) exercise = '可能下雨，建議室內運動'
  else if ((apparent != null && apparent >= 32) || (uvIndex != null && uvIndex >= 8)) exercise = '晨間或傍晚較適宜'
  else if (apparent == null && aqi == null) exercise = '--'

  return [
    { icon: 'checkroom', iconClass: 'text-primary', title: '穿衣建議', text: clothing },
    { icon: 'umbrella', iconClass: 'text-primary', title: '攜帶雨具', text: umbrella },
    { icon: 'local_car_wash', iconClass: 'text-tertiary', title: '洗車指數', text: carWash },
    { icon: 'directions_run', iconClass: 'text-secondary', title: '戶外運動', text: exercise }
  ]
}
