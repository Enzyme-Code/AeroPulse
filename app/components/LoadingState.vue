<script setup lang="ts">
// Shared "waiting on the API" screen — use instead of leaving a section blank while
// data loads. `overlay` covers the parent (which must be `relative`) instead of taking
// up its own space, matching the map page's loading spinner over the map canvas.
withDefaults(defineProps<{
  message?: string
  overlay?: boolean
}>(), {
  message: '載入中...'
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 text-on-surface-variant"
    :class="overlay
      ? 'absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm rounded-xl'
      : 'glass-card rounded-xl p-12 min-h-[40vh]'"
  >
    <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    <p class="font-body-md text-body-md">{{ message }}</p>
  </div>
</template>
