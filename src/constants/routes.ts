/**
 * Route paths – single source of truth for navigation and routing.
 * Use these constants instead of string literals to avoid typos and simplify refactors.
 */
export const ROUTES = {
  LOGIN: '/login',
  INSTALL: '/install',
  CONTACT: '/contact',
  TOP: '/top',
  HOME: '/',
  SWIPE: '/swipe',
  PREMIUM: '/premium',
  PRICING: '/pricing',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  UNLOCKED_PROFILES: '/unlocked-profiles',
  FAQ: '/faq',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_STRIPE: '/admin/stripe',
  ADMIN_IMPERSONATE: (userId: string) => `/admin/impersonate/${userId}`,
  CITY: (slug: string) => `/${slug}`,
} as const
