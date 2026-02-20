/**
 * Thailand locations: Region → City → Area
 * Used for signup/profile dropdowns and discovery filters.
 */
export const THAILAND_LOCATIONS: Record<string, Record<string, string[]>> = {
  Southern: {
    Phuket: ['Patong', 'Kata', 'Karon', 'Phuket Town', 'Kamala', 'Bang Tao'],
    Krabi: ['Ao Nang', 'Krabi Town', 'Railay'],
    'Phang Nga': ['Khao Lak', 'Phang Nga Town'],
  },
  Central: {
    Bangkok: ['Sukhumvit', 'Silom', 'Siam', 'Khao San', 'Riverside'],
    'Chiang Mai': ['Old City', 'Nimman', 'Riverside'],
  },
  Eastern: {
    Pattaya: ['Pattaya Beach', 'Jomtien', 'Naklua'],
    'Koh Samui': ['Chaweng', 'Lamai', 'Bophut'],
  },
}

export type Region = keyof typeof THAILAND_LOCATIONS
export type City = keyof typeof THAILAND_LOCATIONS[Region]

export function getRegions(): Region[] {
  return Object.keys(THAILAND_LOCATIONS) as Region[]
}

export function getCities(region: Region): City[] {
  if (!region || !THAILAND_LOCATIONS[region]) return []
  return Object.keys(THAILAND_LOCATIONS[region]) as City[]
}

export function getAreas(region: Region, city: City): string[] {
  if (!region || !city || !THAILAND_LOCATIONS[region]?.[city]) return []
  return THAILAND_LOCATIONS[region][city]
}

/** Phuket bounds for validation (approx) */
export const PHUKET_BOUNDS = {
  latMin: 7.7,
  latMax: 8.2,
  lngMin: 98.2,
  lngMax: 98.5,
}

export function isWithinThailandBounds(lat: number, lng: number): boolean {
  return lat >= 5.5 && lat <= 21 && lng >= 97 && lng <= 106
}

export function isWithinPhuketBounds(lat: number, lng: number): boolean {
  const { latMin, latMax, lngMin, lngMax } = PHUKET_BOUNDS
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax
}
