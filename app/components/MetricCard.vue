<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string
  unit?: string
  caption?: string
  progress?: number
  progressClass?: string
}>()
</script>

<template>
  <div class="glass-card rounded-xl p-5 flex flex-col justify-between">
    <div class="flex items-center gap-2 mb-2 text-on-surface-variant">
      <span class="material-symbols-outlined text-sm">{{ icon }}</span>
      <span class="font-label-sm text-label-sm uppercase">{{ label }}</span>
    </div>
    <div class="mt-2">
      <span class="font-headline-lg text-headline-lg text-on-surface block">
        {{ value }}
        <span v-if="unit" class="text-lg text-on-surface-variant font-normal">{{ unit }}</span>
      </span>
      <span v-if="caption" class="font-body-md text-body-md text-on-surface-variant mt-1 block">{{ caption }}</span>
    </div>
    <div v-if="progress !== undefined" class="w-full h-2 bg-outline-variant/30 rounded-full mt-4 overflow-hidden">
      <div class="h-full rounded-full" :class="progressClass ?? 'bg-primary'" :style="{ width: `${progress}%` }" />
    </div>
  </div>
</template>
