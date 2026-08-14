export default defineEventHandler(async (event) => {
  const { county } = getQuery(event)

  try {
    const db = useDb()

    const result = county
      ? await db.query(
          `SELECT id, geocode, county_name, township_name, longitude, latitude
           FROM weather.location_info
           WHERE county_name = $1
           ORDER BY township_name`,
          [county]
        )
      : await db.query(
          `SELECT id, geocode, county_name, township_name, longitude, latitude
           FROM weather.location_info
           ORDER BY county_name, township_name`
        )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cities'
    })
  }
})
