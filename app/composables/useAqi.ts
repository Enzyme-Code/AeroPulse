export function aqiColor(aqi: number | null | undefined): string {
  if (aqi == null) return '#94a3b8'
  if (aqi <= 50) return '#10B981'
  if (aqi <= 100) return '#F59E0B'
  if (aqi <= 150) return '#F97316'
  return '#EF4444'
}
