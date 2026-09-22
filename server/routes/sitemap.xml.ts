interface StaticUrl {
  loc: string
  changefreq: string
  priority: string
}

const STATIC_URLS: StaticUrl[] = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/map', changefreq: 'daily', priority: '0.8' }
  // /saved-cities and /settings are excluded: both are marked noindex (personalized
  // localStorage content and an empty placeholder page, respectively), and a noindexed
  // page shouldn't be advertised in the sitemap.
]

export default defineEventHandler(async (event) => {
  const { public: { siteUrl } } = useRuntimeConfig()
  const baseUrl = siteUrl.replace(/\/$/, '')

  const db = useDb()
  const result = await db.query(
    `SELECT DISTINCT county_name, township_name
     FROM info.weather_location_info
     ORDER BY county_name, township_name`
  )

  const weatherUrls: StaticUrl[] = result.rows.map(row => ({
    loc: `/weather/${encodeURIComponent(row.county_name)}/${encodeURIComponent(row.township_name)}`,
    changefreq: 'daily',
    priority: '0.7'
  }))

  const urls = [...STATIC_URLS, ...weatherUrls]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

  setHeader(event, 'Content-Type', 'application/xml; charset=UTF-8')
  return body
})
