export default defineEventHandler(async (event) => {
  const { county } = getQuery(event)

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT
         f.county_name,
         f.start_time,
         f.end_time,
         f.wx_text,
         f.pop,
         f.min_temp,
         f.max_temp,
         f.ci_text,
         f.weather_description,
         t.ticker_code,
         t.zh_name AS source_zh_name,
         t.en_name AS source_en_name
       FROM weather.forecast_36hour f
       JOIN ticker.ticker_info t ON t.id = f.ticker_id
       WHERE $1::text IS NULL OR f.county_name = $1
       ORDER BY f.county_name, f.start_time`,
      [county ?? null]
    )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch 36-hour forecast'
    })
  }
})
