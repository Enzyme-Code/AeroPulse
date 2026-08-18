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

  const filled = sorted.map((row) => {
    lastWxText = row.wx_text ?? lastWxText
    lastPop = row.pop ?? lastPop
    lastWindDirection = row.wind_direction ?? lastWindDirection
    lastWindSpeed = row.wind_speed ?? lastWindSpeed
    return { ...row, wx_text: lastWxText, pop: lastPop, wind_direction: lastWindDirection, wind_speed: lastWindSpeed }
  })

  // Rows before CWA's first published reading for this fetch window have nothing to carry
  // forward from, so they'd otherwise stay null — back-fill those leading gaps from the
  // next known value instead.
  let nextWxText: string | null = null
  let nextPop: string | null = null
  let nextWindDirection: string | null = null
  let nextWindSpeed: string | null = null

  for (let i = filled.length - 1; i >= 0; i--) {
    const row = filled[i]
    nextWxText = row.wx_text ?? nextWxText
    nextPop = row.pop ?? nextPop
    nextWindDirection = row.wind_direction ?? nextWindDirection
    nextWindSpeed = row.wind_speed ?? nextWindSpeed
    row.wx_text ??= nextWxText
    row.pop ??= nextPop
    row.wind_direction ??= nextWindDirection
    row.wind_speed ??= nextWindSpeed
  }

  return filled
}
