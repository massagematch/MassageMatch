/**
 * All Thailand tourist destinations – one config for CityPage, sitemap & Search Console.
 * cityName: value passed to get_therapists_visible(p_city).
 */

export type CitySlug = string

export interface CityData {
  title: string
  h1: string
  cityName: string
  locations: string[]
}

export const CITIES: Record<string, CityData> = {
  phuket: {
    title: 'Outcall Massage Phuket - 24/7 Service',
    h1: 'Massage Phuket',
    cityName: 'Phuket',
    locations: ['Patong Beach', 'Karon', 'Kata', 'Mai Khao', 'Old Phuket Town'],
  },
  bangkok: {
    title: 'Thai Massage Bangkok - Sukhumvit & Old City',
    h1: 'Massage Bangkok',
    cityName: 'Bangkok',
    locations: ['Sukhumvit', 'Khao San Road', 'Silom', 'Siam', 'Riverside'],
  },
  pattaya: {
    title: 'Outcall Massage Pattaya - 24/7 Service',
    h1: 'Massage Pattaya',
    cityName: 'Pattaya',
    locations: ['Walking Street', 'Jomtien Beach', 'Pattaya Beach', 'Naklua'],
  },
  'chiang-mai': {
    title: 'Thai Massage Chiang Mai - Old City & Nimman',
    h1: 'Massage Chiang Mai',
    cityName: 'Chiang Mai',
    locations: ['Old City', 'Nimmanhaemin', 'Night Bazaar', 'Riverside'],
  },
  'koh-samui': {
    title: 'Thai Massage Koh Samui - Chaweng & Lamai',
    h1: 'Massage Koh Samui',
    cityName: 'Koh Samui',
    locations: ['Chaweng Beach', 'Lamai Beach', 'Bophut', 'Maenam'],
  },
  'koh-tao': {
    title: 'Massage Koh Tao - Sairee & Chalok',
    h1: 'Massage Koh Tao',
    cityName: 'Koh Tao',
    locations: ['Sairee Beach', 'Chalok Baan Kao', 'Mae Haad'],
  },
  'koh-phangan': {
    title: 'Thai Massage Koh Phangan - Thong Sala & Haad Rin',
    h1: 'Massage Koh Phangan',
    cityName: 'Koh Phangan',
    locations: ['Thong Sala', 'Haad Rin', 'Sri Thanu', 'Chaloklum'],
  },
  krabi: {
    title: 'Thai Massage Krabi - Ao Nang & Krabi Town',
    h1: 'Massage Krabi',
    cityName: 'Krabi',
    locations: ['Ao Nang', 'Krabi Town', 'Klong Muang', 'Nopparat Thara'],
  },
  'ao-nang': {
    title: 'Massage Ao Nang - Beach & Cliffs',
    h1: 'Massage Ao Nang',
    cityName: 'Ao Nang',
    locations: ['Ao Nang Beach', 'Railay', 'Nopparat Thara'],
  },
  'phi-phi': {
    title: 'Massage Koh Phi Phi - Tonsai & Long Beach',
    h1: 'Massage Koh Phi Phi',
    cityName: 'Koh Phi Phi',
    locations: ['Tonsai', 'Long Beach', 'Phi Phi Viewpoint'],
  },
  railay: {
    title: 'Thai Massage Railay Beach - East & West',
    h1: 'Massage Railay',
    cityName: 'Railay',
    locations: ['Railay West', 'Railay East', 'Phra Nang'],
  },
  'hua-hin': {
    title: 'Thai Massage Hua Hin - Beach & Town',
    h1: 'Massage Hua Hin',
    cityName: 'Hua Hin',
    locations: ['Hua Hin Beach', 'Khao Takiab', 'Cicada Market'],
  },
  karon: {
    title: 'Massage Karon Beach Phuket',
    h1: 'Massage Karon',
    cityName: 'Karon',
    locations: ['Karon Beach', 'Karon Town', 'Kata Noi'],
  },
  kata: {
    title: 'Massage Kata Beach Phuket',
    h1: 'Massage Kata',
    cityName: 'Kata',
    locations: ['Kata Beach', 'Kata Noi', 'Karon View'],
  },
  'mai-khao': {
    title: 'Massage Mai Khao Beach Phuket',
    h1: 'Massage Mai Khao',
    cityName: 'Mai Khao',
    locations: ['Mai Khao Beach', 'Sirinat National Park', 'North Phuket'],
  },
  jomtien: {
    title: 'Massage Jomtien Beach Pattaya',
    h1: 'Massage Jomtien',
    cityName: 'Jomtien',
    locations: ['Jomtien Beach', 'Dongtan Beach', 'Jomtien Complex'],
  },
  nimmanhaemin: {
    title: 'Thai Massage Nimmanhaemin Chiang Mai',
    h1: 'Massage Nimmanhaemin',
    cityName: 'Nimmanhaemin',
    locations: ['Nimman Road', 'Nimman Soi 1-17', 'Think Park'],
  },
  chaweng: {
    title: 'Massage Chaweng Beach Koh Samui',
    h1: 'Massage Chaweng',
    cityName: 'Chaweng',
    locations: ['Chaweng Beach', 'Chaweng Noi', 'Central Festival'],
  },
}

/** All city slugs for routes and sitemap (order: top destinations first). */
export const CITY_SLUGS: CitySlug[] = [
  'phuket',
  'bangkok',
  'pattaya',
  'chiang-mai',
  'koh-samui',
  'koh-tao',
  'koh-phangan',
  'krabi',
  'ao-nang',
  'phi-phi',
  'railay',
  'hua-hin',
  'karon',
  'kata',
  'mai-khao',
  'jomtien',
  'nimmanhaemin',
  'chaweng',
]

export function getCityData(slug: string): CityData | null {
  return CITIES[slug] ?? null
}
