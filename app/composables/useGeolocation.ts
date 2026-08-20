interface Coords {
  lat: number
  lng: number
}

export function getCurrentCoords(timeoutMs = 6000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
    )
  })
}

function toRad(value: number): number {
  return (value * Math.PI) / 180
}

function haversineKm(a: Coords, b: Coords): number {
  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)

  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
}

export function findNearestCity<T extends { latitude: number, longitude: number }>(
  coords: Coords,
  cities: T[],
  maxDistanceKm = 300
): T | null {
  if (!cities.length) return null

  const nearest = cities.reduce<{ city: T, distance: number } | null>((best, city) => {
    const distance = haversineKm(coords, { lat: city.latitude, lng: city.longitude })
    return !best || distance < best.distance ? { city, distance } : best
  }, null)

  if (!nearest || nearest.distance > maxDistanceKm) return null
  return nearest.city
}
