import type { MaybeRefOrGetter } from 'vue'

interface PageSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  noindex?: boolean
}

// Centralizes the per-page title/description/canonical wiring so every page gets a
// unique <title>, meta description and canonical link instead of the single static
// title app.head had before — that's what search engines actually use to tell the
// 368 weather detail pages (and every other route) apart from one another.
export function usePageSeo(options: PageSeoOptions) {
  const route = useRoute()
  const config = useRuntimeConfig()

  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const canonical = computed(() => `${config.public.siteUrl.replace(/\/$/, '')}${route.path}`)

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogType: 'website',
    ogLocale: 'zh_TW',
    twitterCard: 'summary',
    robots: options.noindex ? 'noindex, follow' : 'index, follow'
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }]
  })
}
