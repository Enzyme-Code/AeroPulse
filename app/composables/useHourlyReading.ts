interface HourlyLike {
  data_time: string
  wx_text: string | null
  pop: string | null
  wind_direction: string | null
  wind_speed: string | null
}

export function closestByTime<T extends Record<string, unknown>>(rows: T[], key: string): T | null {
  if (!rows.length) return null
  const now = Date.now()

  return rows.reduce<{ row: T, diff: number } | null>((best, row) => {
    const diff = Math.abs(new Date(row[key] as string).getTime() - now)
    return !best || diff < best.diff ? { row, diff } : best
  }, null)?.row ?? null
}

// CWA only refreshes wx_text/pop/wind every 3 hours; carry the last known value forward for the hours in between.
export function fillForwardHourly<T extends HourlyLike>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => new Date(a.data_time).getTime() - new Date(b.data_time).getTime())
  let lastWxText: string | null = null
  let lastPop: string | null = null
  let lastWindDirection: string | null = null
  let lastWindSpeed: string | null = null

  return sorted.map((row) => {
    lastWxText = row.wx_text ?? lastWxText
    lastPop = row.pop ?? lastPop
    lastWindDirection = row.wind_direction ?? lastWindDirection
    lastWindSpeed = row.wind_speed ?? lastWindSpeed
    return { ...row, wx_text: lastWxText, pop: lastPop, wind_direction: lastWindDirection, wind_speed: lastWindSpeed }
  })
}
