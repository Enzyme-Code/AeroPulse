// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  app: {
    head: {
      title: 'AeroPulse | 首頁',
      htmlAttrs: {
        lang: 'zh-Hant-TW'
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap' }
      ],
      meta: [
        { name: 'google-site-verification', content: '-cLQlfbXB0QOYZ_QkkF1vuaxPirKIE7qfyBbUhaBVcg' }
      ]
    }
  },
  runtimeConfig: {
    postgres: {
      url: '',
      ssl: 'false',
      poolMax: '10'
    },
    public: {
      siteUrl: 'https://aeropulse.enzycode.com'
    }
  }
})
