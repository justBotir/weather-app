/**
 * Canonical identity for a point on earth. 4 dp ≈ 11 m — precise enough to be
 * unambiguous, coarse enough that float noise never creates a duplicate row.
 * Shared by the DB unique constraint and the client-side favourite lookup.
 */
export function toLocationKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

/**
 * Cache key precision. 2 dp ≈ 1.1 km: every user in the same neighbourhood
 * shares one upstream call, which is the single biggest cost saver we have.
 */
export function toCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
}
