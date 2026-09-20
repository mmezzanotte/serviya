// ─── Geolocalización y cálculo de distancias ─────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 * @returns distancia en kilómetros
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estima tiempo de llegada en minutos a una velocidad promedio urbana (25 km/h).
 */
export function estimateETAMinutes(distanceKm: number, avgSpeedKmh = 25): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

/**
 * Formatea el ETA para mostrar en la UI.
 * Ej: "a 8 min" / "a 1 h 15 min" / "muy cerca"
 */
export function formatETA(distanceKm: number): string {
  if (distanceKm < 0.3) return 'muy cerca';
  const minutes = estimateETAMinutes(distanceKm);
  if (minutes < 60) return `a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `a ${hours} h ${mins} min` : `a ${hours} h`;
}

/**
 * Formatea una distancia en km para mostrar en la UI.
 * Ej: "0.8 km" / "1.5 km"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Ordena una lista de profesionales por distancia al cliente.
 */
export function sortByDistance<T extends { location: Coordinates }>(
  items: T[],
  clientLocation: Coordinates
): T[] {
  return [...items].sort((a, b) => {
    const distA = haversineDistanceKm(
      clientLocation.lat, clientLocation.lng,
      a.location.lat, a.location.lng
    );
    const distB = haversineDistanceKm(
      clientLocation.lat, clientLocation.lng,
      b.location.lat, b.location.lng
    );
    return distA - distB;
  });
}
