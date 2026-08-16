export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId')

  try {
    const db = useDb()

    const result = await db.query(
      `SELECT siteid, country, sitename, longitude, latitude
       FROM info.air_pollution_location
       WHERE siteid = $1`,
      [siteId]
    )

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Station not found'
      })
    }

    return result.rows[0]
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch air pollution station'
    })
  }
})
