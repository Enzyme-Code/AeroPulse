export default defineEventHandler(async (event) => {
  const { geocode } = getQuery(event)

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT
         l.geocode,
         l.county_name,
         l.township_name,
         f.data_time,
         MAX(f.element_value) FILTER (WHERE f.element_name = '天氣現象') AS wx_text,
         MAX(f.element_value) FILTER (WHERE f.element_name = '3小時降雨機率') AS pop,
         MAX(f.element_value) FILTER (WHERE f.element_name = '溫度') AS temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '露點溫度') AS dew_point,
         MAX(f.element_value) FILTER (WHERE f.element_name = '相對濕度') AS humidity,
         MAX(f.element_value) FILTER (WHERE f.element_name = '體感溫度') AS apparent_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '舒適度指數') AS comfort_index,
         MAX(f.element_value) FILTER (WHERE f.element_name = '風向') AS wind_direction,
         MAX(f.element_value) FILTER (WHERE f.element_name = '風速') AS wind_speed,
         MAX(f.element_value) FILTER (WHERE f.element_name = '天氣預報綜合描述') AS weather_description
       FROM weather.forecast_three_days f
       JOIN weather.location_info l ON l.id = f.location_info_id
       WHERE $1::text IS NULL OR l.geocode = $1
       GROUP BY l.geocode, l.county_name, l.township_name, f.data_time
       ORDER BY l.geocode, f.data_time`,
      [geocode ?? null]
    )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch three-day forecast'
    })
  }
})
