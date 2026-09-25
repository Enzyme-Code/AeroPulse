<script setup lang="ts">
// Random one-liner scrolling under the header. Lines live in ~/data/quips.json — add or
// edit entries there; a new random one is picked every time the previous one finishes.
import quips from '~/data/quips.json'

// Constant scroll speed, so short and long lines move at the same pace.
const PIXELS_PER_SECOND = 70

const current = ref<string | null>(null)
// Invisible copy used to measure the next line before it starts moving, so its start
// offset and duration are right from the first frame instead of jumping mid-scroll.
const measuring = ref('')
const trackEl = ref<HTMLElement | null>(null)
const measureEl = ref<HTMLElement | null>(null)
const duration = ref(12)
const trackWidth = ref(0)

function randomQuip(): string {
  if (quips.length === 1) return quips[0]
  let next = current.value
  while (next === current.value) next = quips[Math.floor(Math.random() * quips.length)]
  return next as string
}

async function showNext() {
  if (!quips.length) return
  const next = randomQuip()
  measuring.value = next
  await nextTick()
  trackWidth.value = trackEl.value?.clientWidth ?? 0
  const distance = trackWidth.value + (measureEl.value?.scrollWidth ?? 0)
  duration.value = Math.max(6, distance / PIXELS_PER_SECOND)
  current.value = next
}

// Picked on the client only — a server-chosen line would never match the client's
// random pick and cause a hydration mismatch.
onMounted(showNext)
</script>

<template>
  <div
    v-if="quips.length"
    class="w-full bg-secondary-fixed/60 text-on-secondary-fixed border-b border-secondary-fixed"
    role="marquee"
    aria-live="off"
  >
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-8 flex items-center gap-space-sm">
      <span class="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">campaign</span>
      <div ref="trackEl" class="quip-track relative flex-1 overflow-hidden h-full">
        <span
          v-if="current"
          :key="current"
          class="quip-text absolute top-1/2 left-0 whitespace-nowrap font-body-sm text-body-sm"
          :style="{ animationDuration: `${duration}s`, '--quip-start': `${trackWidth}px` }"
          @animationend="showNext"
        >
          {{ current }}
        </span>
        <span ref="measureEl" class="invisible absolute whitespace-nowrap font-body-sm text-body-sm" aria-hidden="true">{{ measuring }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quip-text {
  animation-name: quip-scroll;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: both;
}

/* Starts just past the track's right edge (--quip-start = track width) and ends once the
   whole line has left past the left edge; the next line is picked on animationend. */
@keyframes quip-scroll {
  from { transform: translate(var(--quip-start, 100vw), -50%); }
  to { transform: translate(-100%, -50%); }
}

.quip-track:hover .quip-text {
  animation-play-state: paused;
}

/* No scrolling for people who've asked for reduced motion — show the line in place. */
@media (prefers-reduced-motion: reduce) {
  .quip-text {
    animation: none;
    position: static;
    display: block;
    transform: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
