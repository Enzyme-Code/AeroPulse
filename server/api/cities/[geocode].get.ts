export default defineEventHandler(async (event) => {
  const geocode = getRouterParam(event, 'geocode')

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT id, geocode, county_name, township_name, longitude, latitude
       FROM info.weather_location_info
       WHERE geocode = $1`,
      [geocode]
    )

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'City not found'
      })
    }

    return result.rows[0]
  } catch (error) {
    if (error?.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch city'
    })
  }
})
