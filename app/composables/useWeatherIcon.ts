function isNightTime(date: Date): boolean {
  const hours = date.getHours()
  return hours >= 18 || hours < 6
}

export function weatherIcon(text: string | null, at: Date = new Date()): string {
  const night = isNightTime(at)

  if (!text) return night ? 'partly_cloudy_night' : 'partly_cloudy_day'
  if (text.includes('雷')) return 'thunderstorm'
  if (text.includes('雨')) return 'rainy'
  if (text.includes('晴') && text.includes('雲')) return night ? 'partly_cloudy_night' : 'partly_cloudy_day'
  if (text.includes('晴')) return night ? 'clear_night' : 'sunny'
  if (text.includes('霧')) return 'foggy'
  if (text.includes('雲') || text.includes('陰')) return 'cloud'
  return night ? 'partly_cloudy_night' : 'partly_cloudy_day'
}
