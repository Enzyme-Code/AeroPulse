<script setup lang="ts">
// Weekly detail + air-quality detail for the location useLocationWeather() last loaded.
// Rendered under the dashboard on both the home page and /weather/[county]/[township],
// so the full breakdown is a scroll away instead of a separate page.
const { weekly, pollution, loading, heroWeekly } = useLocationWeather()
const { toDisplay, unitLabel } = useTemperatureUnit()

// The chart plots raw numbers, so hand it temperatures already in the selected unit.
const weeklyChartRows = computed(() => weekly.value.map(r => ({
  start_time: r.start_time,
  max_temp: r.max_temp == null ? null : toDisplay(r.max_temp),
  avg_temp: r.avg_temp == null ? null : toDisplay(r.avg_temp),
  min_temp: r.min_temp == null ? null : toDisplay(r.min_temp)
})))

// Taiwan EPA (環境部) AQI breakpoint table, 114年版 (effective 2025), one
// linear-interpolation segment per {concentration range -> sub-index range}.
// Source: https://airtw.moenv.gov.tw/cht/Information/Standard/AirQualityIndicatorNew.aspx
interface AqiBreakpoint { cLow: number, cHigh: number, iLow: number, iHigh: number }

const AQI_BREAKPOINTS: Record<string, AqiBreakpoint[]> = {
  pm25: [ // µg/m³, 24hr
    { cLow: 0, cHigh: 12.4, iLow: 0, iHigh: 50 },
    { cLow: 12.5, cHigh: 30.4, iLow: 51, iHigh: 100 },
    { cLow: 30.5, cHigh: 50.4, iLow: 101, iHigh: 150 },
    { cLow: 50.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
    { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
    { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
    { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
  ],
  pm10: [ // µg/m³, 24hr
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 190, iLow: 101, iHigh: 150 },
    { cLow: 191, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 }
  ],
  o3_8h: [ // ppb, 8hr
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
    { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 }
  ],
  co_8h: [ // ppm, 8hr
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
    { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 }
  ],
  so2_1h: [ // ppb, 1hr
    { cLow: 0, cHigh: 8, iLow: 0, iHigh: 50 },
    { cLow: 9, cHigh: 65, iLow: 51, iHigh: 100 },
    { cLow: 66, cHigh: 160, iLow: 101, iHigh: 150 },
    { cLow: 161, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
    { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 }
  ],
  no2_1h: [ // ppb, 1hr
    { cLow: 0, cHigh: 21, iLow: 0, iHigh: 50 },
    { cLow: 22, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
    { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 }
  ]
}

const AQI_LEVELS = [
  { max: 50, name: '良好', colorClass: 'bg-green-400' },
  { max: 100, name: '普通', colorClass: 'bg-yellow-400' },
  { max: 150, name: '對敏感族群不健康', colorClass: 'bg-orange-400' },
  { max: 200, name: '對所有族群不健康', colorClass: 'bg-red-500' },
  { max: 300, name: '非常不健康', colorClass: 'bg-purple-500' },
  { max: Infinity, name: '危害', colorClass: 'bg-rose-900' }
]

function aqiLevel(index: number) {
  return AQI_LEVELS.find(l => index <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

// Standard EPA-style linear interpolation within the matched breakpoint segment.
function subIndex(table: AqiBreakpoint[], concentration: number): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null
  const bp = table.find(b => concentration >= b.cLow && concentration <= b.cHigh)
  if (bp) return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow)
  return concentration > table[table.length - 1].cHigh ? 500 : 0
}

function pollutantGauge(table: AqiBreakpoint[], raw: string | number | null | undefined) {
  const value = raw == null ? NaN : Number(raw)
  if (!Number.isFinite(value)) return undefined
  const index = subIndex(table, value)
  if (index == null) return undefined
  const level = aqiLevel(index)
  return { progress: Math.min(100, (index / 500) * 100), progressClass: level.colorClass, caption: level.name }
}

const pm10Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.pm10, pollution.value?.pm10))
const pm25Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.pm25, pollution.value?.pm2_5))
const o3Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.o3_8h, pollution.value?.o3_8hr))
const coGauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.co_8h, pollution.value?.co_8hr))
const so2Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.so2_1h, pollution.value?.so2))
const no2Gauge = computed(() => pollutantGauge(AQI_BREAKPOINTS.no2_1h, pollution.value?.no2))
</script>

<template>
  <div v-if="!loading" class="flex flex-col gap-space-lg md:gap-10">
    <section class="flex flex-col gap-space-md">
      <div class="flex items-center gap-space-xs">
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">一週詳細預報</h3>
        <span v-if="heroWeekly?.weather_description" class="relative group inline-flex">
          <span class="material-symbols-outlined text-[18px] text-outline cursor-help">info</span>
          <span class="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm shadow-lg z-10">
            {{ heroWeekly.weather_description }}
          </span>
        </span>
      </div>
      <ClientOnly>
        <div v-if="weekly.length" class="bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl shadow-sm">
          <WeeklyForecastChart :rows="weeklyChartRows" :unit="unitLabel" />
        </div>
        <template #fallback>
          <div class="w-full h-96 animate-pulse bg-surface-container-lowest/60 rounded-2xl" />
        </template>
      </ClientOnly>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-sm sm:gap-space-md md:gap-space-lg">
        <MetricCard
          icon="thermostat"
          label="平均溫度"
          :value="toDisplay(heroWeekly?.avg_temp)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="arrow_upward"
          label="最高溫度"
          :value="toDisplay(heroWeekly?.max_temp)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="arrow_downward"
          label="最低溫度"
          :value="toDisplay(heroWeekly?.min_temp)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="water_drop"
          label="平均相對濕度"
          :value="heroWeekly?.avg_humidity ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="grain"
          label="平均露點溫度"
          :value="toDisplay(heroWeekly?.avg_dew_point)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="rainy"
          label="12小時降雨機率"
          :value="heroWeekly?.pop ?? '--'"
          unit="%"
        />
        <MetricCard
          icon="thermostat"
          label="最高體感溫度"
          :value="toDisplay(heroWeekly?.max_apparent_temp)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="thermostat"
          label="最低體感溫度"
          :value="toDisplay(heroWeekly?.min_apparent_temp)"
          :unit="unitLabel"
        />
        <MetricCard
          icon="mood"
          label="最大舒適度指數"
          :value="heroWeekly?.max_comfort_index ?? '--'"
        />
        <MetricCard
          icon="mood"
          label="最小舒適度指數"
          :value="heroWeekly?.min_comfort_index ?? '--'"
        />
        <MetricCard
          icon="air"
          label="風速"
          :value="heroWeekly?.wind_speed ?? '--'"
          unit=" 級"
          :caption="heroWeekly?.wind_direction ?? undefined"
        />
      </div>
    </section>

    <section class="flex flex-col gap-space-md">
      <div class="flex items-center gap-space-xs">
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">空氣品質詳情</h3>
        <span v-if="pollution?.pollutant" class="relative group inline-flex">
          <span class="material-symbols-outlined text-[18px] text-outline cursor-help">info</span>
          <span class="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm shadow-lg z-10">
            主要污染物：{{ pollution.pollutant }}
          </span>
        </span>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-sm sm:gap-space-md md:gap-space-lg">
        <MetricCard
          icon="blur_on"
          label="PM10"
          :value="pollution?.pm10 != null ? String(pollution.pm10) : '--'"
          unit="μg/m³"
          :caption="pm10Gauge?.caption"
          :progress="pm10Gauge?.progress"
          :progress-class="pm10Gauge?.progressClass"
          hide-progress-on-mobile
          info="懸浮微粒。24小時平均濃度,數值依環境部AQI分級換算,顏色越偏紅紫代表濃度越高、對呼吸道影響越大。"
        />
        <MetricCard
          icon="grain"
          label="PM2.5"
          :value="pollution?.pm2_5 ?? '--'"
          unit="μg/m³"
          :caption="pm25Gauge?.caption"
          :progress="pm25Gauge?.progress"
          :progress-class="pm25Gauge?.progressClass"
          hide-progress-on-mobile
          info="細懸浮微粒,粒徑更小可深入肺部與血管。24小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="blur_on"
          label="PM10 平均"
          :value="pollution?.pm10_avg ?? '--'"
          unit="μg/m³"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的24小時值。"
        />
        <MetricCard
          icon="grain"
          label="PM2.5 平均"
          :value="pollution?.pm2_5_avg ?? '--'"
          unit="μg/m³"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的24小時值。"
        />
        <MetricCard
          icon="wb_sunny"
          label="臭氧 O3"
          mobile-label="臭氧"
          :value="pollution?.o3 ?? '--'"
          unit="ppb"
          info="臭氧當前濃度(非用於AQI計算的8小時平均值)。高濃度易在夏季晴朗午後出現,刺激眼睛與呼吸道。"
        />
        <MetricCard
          icon="wb_sunny"
          label="臭氧 8小時平均"
          mobile-label="臭氧平均"
          :value="pollution?.o3_8hr ?? '--'"
          unit="ppb"
          :caption="o3Gauge?.caption"
          :progress="o3Gauge?.progress"
          :progress-class="o3Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的8小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="local_fire_department"
          label="一氧化碳 CO"
          mobile-label="一氧化碳"
          :value="pollution?.co ?? '--'"
          unit="ppm"
          info="一氧化碳當前濃度(非用於AQI計算的8小時平均值),主要來自燃燒與交通排放。"
        />
        <MetricCard
          icon="local_fire_department"
          label="一氧化碳 8小時平均"
          mobile-label="一氧化碳平均"
          :value="pollution?.co_8hr ?? '--'"
          unit="ppm"
          :caption="coGauge?.caption"
          :progress="coGauge?.progress"
          :progress-class="coGauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的8小時平均濃度,數值依環境部AQI分級換算。"
        />
        <MetricCard
          icon="science"
          label="二氧化硫 SO2"
          mobile-label="二氧化硫"
          :value="pollution?.so2 ?? '--'"
          unit="ppb"
          :caption="so2Gauge?.caption"
          :progress="so2Gauge?.progress"
          :progress-class="so2Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的1小時濃度,數值依環境部AQI分級換算。主要來自工業與燃煤排放。"
        />
        <MetricCard
          icon="science"
          label="SO2 平均"
          mobile-label="二氧化硫平均"
          :value="pollution?.so2_avg ?? '--'"
          unit="ppb"
          info="測站另一組移動平均濃度,用於比對趨勢,非AQI計算採用的1小時值。"
        />
        <MetricCard
          icon="science"
          label="二氧化氮 NO2"
          mobile-label="二氧化氮"
          :value="pollution?.no2 ?? '--'"
          unit="ppb"
          :caption="no2Gauge?.caption"
          :progress="no2Gauge?.progress"
          :progress-class="no2Gauge?.progressClass"
          hide-progress-on-mobile
          info="AQI計算採用的1小時濃度,數值依環境部AQI分級換算。主要來自機動車輛排放。"
        />
        <MetricCard
          icon="science"
          label="一氧化氮 NO"
          mobile-label="一氧化氮"
          :value="pollution?.no ?? '--'"
          unit="ppb"
          info="氮氧化物的一種,非AQI計算項目,常作為交通污染來源的參考指標。"
        />
        <MetricCard
          icon="science"
          label="氮氧化物 NOx"
          mobile-label="氮氧化物"
          :value="pollution?.nox ?? '--'"
          unit="ppb"
          info="NO 與 NO2 的總和,非AQI計算項目,常作為交通污染來源的參考指標。"
        />
        <MetricCard
          icon="air"
          label="測站風速"
          :value="pollution?.wind_speed ?? '--'"
          unit="m/s"
          info="測站當地風速,風速越大越有助於污染物擴散、降低濃度。"
        />
        <MetricCard
          icon="explore"
          label="測站風向"
          :value="pollution?.wind_direc ?? '--'"
          unit="°"
          info="測站當地風向(氣象角度,0°/360°為北風、90°為東風)。"
        />
      </div>
    </section>
  </div>
</template>
