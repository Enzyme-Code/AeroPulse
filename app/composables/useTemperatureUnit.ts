type TemperatureUnit = 'C' | 'F'

const STORAGE_KEY = 'aeropulse:temp-unit'

// All API temperatures are Celsius; conversion happens only at display time so the
// header's °C/°F toggle can flip every reading on the page without refetching.
export function useTemperatureUnit() {
  const unit = useState<TemperatureUnit>('temperatureUnit', () => 'C')
  const loaded = useState('temperatureUnitLoaded', () => false)

  function load() {
    if (loaded.value) return
    loaded.value = true
    if (localStorage.getItem(STORAGE_KEY) === 'F') unit.value = 'F'
  }

  function setUnit(value: TemperatureUnit) {
    unit.value = value
    localStorage.setItem(STORAGE_KEY, value)
  }

  // Number only (no unit suffix), rounded to whole degrees for °F since the converted
  // decimals are noise; '--' when there's no reading.
  function toDisplay(celsius: number | string | null | undefined): string {
    if (celsius == null || celsius === '') return '--'
    const n = Number(celsius)
    if (!Number.isFinite(n)) return '--'
    return unit.value === 'F' ? String(Math.round(n * 9 / 5 + 32)) : String(n)
  }

  const unitLabel = computed(() => (unit.value === 'F' ? '°F' : '°C'))

  function formatTemp(celsius: number | string | null | undefined): string {
    return `${toDisplay(celsius)}${unitLabel.value}`
  }

  return { unit, unitLabel, load, setUnit, toDisplay, formatTemp }
}
