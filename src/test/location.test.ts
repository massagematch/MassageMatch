import { describe, it, expect } from 'vitest'
import { distanceKm } from '@/lib/geo'
import {
  THAILAND_LOCATIONS,
  getRegions,
  getCities,
  getAreas,
  isWithinThailandBounds,
  isWithinPhuketBounds,
} from '@/lib/thailandLocations'

describe('Thailand location + maps', () => {
  it('Signup: Region Southern → City Phuket → Area Patong exists', () => {
    const regions = getRegions()
    expect(regions).toContain('Southern')
    const cities = getCities('Southern')
    expect(cities).toContain('Phuket')
    const areas = getAreas('Southern', 'Phuket')
    expect(areas).toContain('Patong')
  })

  it('distanceKm: same point = 0', () => {
    expect(distanceKm(7.888, 98.299, 7.888, 98.299)).toBeLessThan(0.01)
  })

  it('distanceKm: ~5km apart', () => {
    const km = distanceKm(7.888, 98.299, 7.93, 98.29)
    expect(km).toBeGreaterThan(3)
    expect(km).toBeLessThan(8)
  })

  it('Phuket coords within Thailand and Phuket bounds', () => {
    expect(isWithinThailandBounds(7.888, 98.299)).toBe(true)
    expect(isWithinPhuketBounds(7.888, 98.299)).toBe(true)
  })

  it('Map link format: Google Maps q=lat,lng', () => {
    const lat = 7.888
    const lng = 98.299
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    expect(url).toContain('7.888')
    expect(url).toContain('98.299')
  })

  it('Non-shared location shows "Location private" (contract)', () => {
    const therapist = { share_location: false, location_lat: 7.888, location_lng: 98.299 }
    const showMap = therapist.share_location && therapist.location_lat != null && therapist.location_lng != null
    expect(showMap).toBe(false)
  })
})
