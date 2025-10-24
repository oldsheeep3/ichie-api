import { getUserByBeacon, listBeaconsInRange } from '../db/ibeacon';
import dotenv from 'dotenv';

dotenv.config();

// Configurable ranges (can be overridden via env)
export const MAJOR_MIN = Number(process.env.MAJOR_MIN ?? 2); // reserve 0 and 1
export const MAJOR_MAX = Number(process.env.MAJOR_MAX ?? 65535);
export const MINOR_MIN = Number(process.env.MINOR_MIN ?? 0);
export const MINOR_MAX = Number(process.env.MINOR_MAX ?? 65535);

function randomInt(min: number, max: number) {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a unique (major, minor) pair that does not exist in the DB.
 * Throws if unable to find a free pair within maxAttempts.
 */
export async function generateUniqueMajorMinor(opts?: {
  maxAttempts?: number;
}) {
  const randomAttempts = opts?.maxAttempts ?? 500;

  // First try random sampling to find a free slot quickly
  for (let attempt = 0; attempt < randomAttempts; attempt += 1) {
    const major = randomInt(MAJOR_MIN, MAJOR_MAX);
    const minor = randomInt(MINOR_MIN, MINOR_MAX);
    const existing = await getUserByBeacon(major, minor);
    if (!existing) {
      return { major, minor };
    }
  }

  // Fallback: balance allocation. Fetch existing beacons in the range and
  // prefer majors with the fewest assigned minors, then choose the smallest
  // available minor within that major. This avoids concentrating assignments
  // on a small subset of majors when space is tight.
  const occupied = await listBeaconsInRange(
    MAJOR_MIN,
    MAJOR_MAX,
    MINOR_MIN,
    MINOR_MAX
  );

  // Build a map: major -> Set(minor)
  const occupiedMap = new Map<number, Set<number>>();
  for (const r of occupied) {
    const s = occupiedMap.get(r.major) ?? new Set<number>();
    s.add(r.minor);
    occupiedMap.set(r.major, s);
  }

  // Build array of majors with counts, then sort by count asc, then by major asc
  const majors: Array<{ major: number; count: number }> = [];
  for (let maj = MAJOR_MIN; maj <= MAJOR_MAX; maj += 1) {
    const count = occupiedMap.get(maj)?.size ?? 0;
    majors.push({ major: maj, count });
  }
  majors.sort((a, b) => a.count - b.count || a.major - b.major);

  // For each major (starting from least-used), find the smallest free minor
  for (const m of majors) {
    const used = occupiedMap.get(m.major) ?? new Set<number>();
    for (let min = MINOR_MIN; min <= MINOR_MAX; min += 1) {
      if (!used.has(min)) {
        return { major: m.major, minor: min };
      }
    }
  }

  throw new Error(
    'Unable to find a free major/minor pair in the configured range'
  );
}
