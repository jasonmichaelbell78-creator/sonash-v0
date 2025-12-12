/**
 * Distance calculation utilities for SoNash
 *
 * Uses the Haversine formula to calculate the great-circle distance
 * between two points on Earth given their latitude and longitude.
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Earth's radius in miles
 * Using mean radius for accuracy at Nashville's latitude (~36°N)
 */
const EARTH_RADIUS_MILES = 3958.8

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculates the distance between two geographic points using the Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This provides accurate
 * distance calculations for Nashville-scale distances.
 *
 * @param point1 - First coordinate (lat/lng)
 * @param point2 - Second coordinate (lat/lng)
 * @returns Distance in miles
 *
 * @example
 * const distance = calculateDistance(
 *   { lat: 36.1627, lng: -86.7816 }, // Downtown Nashville
 *   { lat: 36.1745, lng: -86.7679 }  // East Nashville
 * )
 * // Returns approximately 1.0 miles
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const lat1 = toRadians(point1.lat)
  const lat2 = toRadians(point2.lat)
  const deltaLat = toRadians(point2.lat - point1.lat)
  const deltaLng = toRadians(point2.lng - point1.lng)

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_MILES * c
}

/**
 * Formats a distance for user-friendly display
 *
 * @param miles - Distance in miles
 * @returns Formatted string (e.g., "0.3 mi", "2.5 mi", "15 mi")
 *
 * @example
 * formatDistance(0.25)  // "0.3 mi"
 * formatDistance(2.456) // "2.5 mi"
 * formatDistance(15.2)  // "15 mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return "< 0.1 mi"
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`
  }
  return `${Math.round(miles)} mi`
}

/**
 * Sorts an array of items with coordinates by distance from a reference point
 *
 * @param items - Array of items with optional coordinates
 * @param userLocation - User's current location
 * @param getCoords - Function to extract coordinates from an item
 * @returns Sorted array (nearest first), items without coordinates at the end
 *
 * @example
 * const sorted = sortByDistance(meetings, userLocation, (m) => m.coordinates)
 */
export function sortByDistance<T>(
  items: T[],
  userLocation: Coordinates,
  getCoords: (item: T) => Coordinates | undefined
): T[] {
  return [...items].sort((a, b) => {
    const coordsA = getCoords(a)
    const coordsB = getCoords(b)

    // Items without coordinates go to the end
    if (!coordsA && !coordsB) return 0
    if (!coordsA) return 1
    if (!coordsB) return -1

    const distA = calculateDistance(userLocation, coordsA)
    const distB = calculateDistance(userLocation, coordsB)

    return distA - distB
  })
}
