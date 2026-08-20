export default defineEventHandler(async (event) => {
  const { siteId } = getQuery(event)

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT DISTINCT ON (loc.siteid)
         loc.siteid,
         loc.sitename,
         loc.country,
         a.publishtime,
         a.aqi,
         a.status,
         a.pollutant,
         a.pm2_5,
         a.pm10,
         a.o3,
         a.o3_8hr,
         a.co,
         a.co_8hr,
         a.so2,
         a.no2,
         a.nox,
         a.no,
         a.wind_speed,
         a.wind_direc,
         a.pm2_5_avg,
         a.pm10_avg,
         a.so2_avg,
         t.ticker_code,
         t.zh_name AS source_zh_name,
         t.en_name AS source_en_name
       FROM air.general_air_pollution a
       JOIN ticker.ticker_info t ON t.id = a.ticker_id
       JOIN info.air_pollution_location loc ON loc.siteid = a.site_id
       WHERE $1::int IS NULL OR a.site_id = $1
       ORDER BY loc.siteid, a.publishtime DESC`,
      [siteId ?? null]
    )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch air pollution data'
    })
  }
})
