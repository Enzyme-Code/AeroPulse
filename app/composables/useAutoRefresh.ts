import type { Ref } from 'vue'

export const AUTO_REFRESH_MS = 5 * 60 * 1000

// Re-runs `refresh` once the data is older than AUTO_REFRESH_MS. Checked once a minute
// rather than on a fixed timer, and skipped while the tab is hidden — so a
// background tab makes no requests, and coming back to a stale tab refreshes right away.
// `lastUpdated` is a ms timestamp; 0 means "not loaded yet" and is left to the initial load.
export function useAutoRefresh(refresh: () => unknown, lastUpdated: Ref<number>) {
  let timer: ReturnType<typeof setInterval> | undefined

  function refreshIfStale() {
    if (document.hidden || !lastUpdated.value) return
    if (Date.now() - lastUpdated.value >= AUTO_REFRESH_MS) refresh()
  }

  onMounted(() => {
    timer = setInterval(refreshIfStale, 60_000)
    document.addEventListener('visibilitychange', refreshIfStale)
  })

  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', refreshIfStale)
  })
}

// "剛剛更新" / "5 分鐘前更新" label for a ms timestamp, re-evaluated every 30 seconds.
export function useUpdatedAgo(lastUpdated: Ref<number>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => { now.value = Date.now() }, 30_000)
  })
  onUnmounted(() => clearInterval(timer))

  return computed(() => {
    if (!lastUpdated.value) return ''
    const minutes = Math.floor(Math.max(0, now.value - lastUpdated.value) / 60_000)
    if (minutes < 1) return '剛剛更新'
    if (minutes < 60) return `${minutes} 分鐘前更新`
    return `${Math.floor(minutes / 60)} 小時前更新`
  })
}
