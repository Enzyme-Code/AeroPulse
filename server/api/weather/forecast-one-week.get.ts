export default defineEventHandler(async (event) => {
  const { geocode } = getQuery(event)

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT
         l.geocode,
         l.county_name,
         l.township_name,
         f.start_time,
         f.end_time,
         MAX(f.element_value) FILTER (WHERE f.element_name = '天氣現象') AS wx_text,
         MAX(f.element_value) FILTER (WHERE f.element_name = '12小時降雨機率') AS pop,
         MAX(f.element_value) FILTER (WHERE f.element_name = '平均溫度') AS avg_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最低溫度') AS min_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最高溫度') AS max_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '平均露點溫度') AS avg_dew_point,
         MAX(f.element_value) FILTER (WHERE f.element_name = '平均相對濕度') AS avg_humidity,
         MAX(f.element_value) FILTER (WHERE f.element_name = '風向') AS wind_direction,
         MAX(f.element_value) FILTER (WHERE f.element_name = '風速') AS wind_speed,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最高體感溫度') AS max_apparent_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最低體感溫度') AS min_apparent_temp,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最大舒適度指數') AS max_comfort_index,
         MAX(f.element_value) FILTER (WHERE f.element_name = '最小舒適度指數') AS min_comfort_index,
         MAX(f.element_value) FILTER (WHERE f.element_name = '紫外線指數') AS uv_index,
         MAX(f.element_value) FILTER (WHERE f.element_name = '天氣預報綜合描述') AS weather_description
       FROM weather.forecast_one_week f
       JOIN info.weather_location_info l ON l.id = f.location_info_id
       WHERE $1::text IS NULL OR l.geocode = $1
       GROUP BY l.geocode, l.county_name, l.township_name, f.start_time, f.end_time
       ORDER BY l.geocode, f.start_time`,
      [geocode ?? null]
    )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch one-week forecast'
    })
  }
})
