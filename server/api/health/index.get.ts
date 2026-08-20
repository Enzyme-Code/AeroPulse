export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const result = await db.query('SELECT 1 as ok')

    return {
      status: 'ok',
      db: result.rows[0]?.ok === 1
    }
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database connection failed'
    })
  }
})
