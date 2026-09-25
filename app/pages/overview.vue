<script setup lang="ts">
usePageSeo({
  title: '全台即時概況 | AeroPulse',
  description: '一次比較全台 22 個縣市的即時天氣、今日氣溫、降雨機率與空氣品質(AQI),可依北部、中部、南部、東部與離島篩選。'
})
</script>

<template>
  <div class="flex flex-col gap-space-lg md:gap-10">
    <div>
      <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">全台即時概況</h2>
      <p class="font-body-md text-body-md text-on-surface-variant mt-1">點選縣市即可查看鄉鎮的詳細預報與空氣品質。</p>
    </div>
    <CountyOverviewTable />
  </div>
</template>
