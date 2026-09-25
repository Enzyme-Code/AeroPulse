<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string
  unit?: string
  caption?: string
  progress?: number
  progressClass?: string
  info?: string
  hideProgressOnMobile?: boolean
  mobileLabel?: string
  iconClass?: string
  valueClass?: string
  badge?: string
  badgeClass?: string
}>()
</script>

<template>
  <div class="bg-surface-container-lowest p-space-md md:p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
    <div class="flex flex-col">
      <div class="flex items-center justify-between gap-2 text-on-surface-variant">
        <span class="flex items-center gap-1 font-title-sm text-body-sm md:text-title-sm min-w-0">
          <span :class="mobileLabel ? 'md:hidden' : ''">{{ mobileLabel ?? label }}</span>
          <span v-if="mobileLabel" class="hidden md:inline">{{ label }}</span>
          <span v-if="info" class="relative group inline-flex">
            <span class="material-symbols-outlined text-[16px] text-outline cursor-help">info</span>
            <span class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 p-3 rounded-lg bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm shadow-lg z-20 font-normal">
              {{ info }}
            </span>
          </span>
        </span>
        <span class="material-symbols-outlined text-[18px] md:text-[20px] shrink-0" :class="iconClass ?? 'text-primary'">{{ icon }}</span>
      </div>
      <div class="mt-space-sm mb-space-xs md:mt-space-md md:mb-space-sm">
        <span class="inline-flex flex-wrap items-baseline gap-x-space-xs">
          <span class="font-metric-val text-headline-md md:text-metric-val" :class="valueClass ?? 'text-on-surface'">
            {{ value }}<span v-if="unit" class="text-body-md md:text-headline-sm font-semibold">{{ unit }}</span>
          </span>
          <span v-if="badge" class="font-label-md text-label-md font-bold" :class="badgeClass ?? 'text-on-surface-variant'">{{ badge }}</span>
        </span>
      </div>
    </div>
    <slot name="footer">
      <p v-if="caption" class="font-label-md md:font-body-sm text-label-md md:text-body-sm text-outline">{{ caption }}</p>
    </slot>
    <div
      v-if="progress !== undefined"
      class="w-full h-1.5 bg-surface-container-high rounded-full mt-space-sm overflow-hidden"
      :class="hideProgressOnMobile ? 'hidden md:block' : ''"
    >
      <div class="h-full rounded-full" :class="progressClass ?? 'bg-primary'" :style="{ width: `${progress}%` }" />
    </div>
  </div>
</template>
