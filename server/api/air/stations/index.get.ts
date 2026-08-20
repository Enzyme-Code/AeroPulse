export default defineEventHandler(async (event) => {
  const { country } = getQuery(event)

  try {
    const db = useDb()

    const result = country
      ? await db.query(
          `SELECT siteid, country, sitename, longitude, latitude
           FROM info.air_pollution_location
           WHERE country = $1
           ORDER BY sitename`,
          [country]
        )
      : await db.query(
          `SELECT siteid, country, sitename, longitude, latitude
           FROM info.air_pollution_location
           ORDER BY country, sitename`
        )

    return result.rows
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch air pollution stations'
    })
  }
})
