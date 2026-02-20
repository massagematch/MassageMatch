// A/B Testing utilities

import { supabase } from './supabase'

export async function getVariant(testName: string, userId: string): Promise<string> {
  // Check if user already has a variant assigned
  const { data: existing } = await supabase
    .from('ab_tests')
    .select('variant')
    .eq('test_name', testName)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing.variant
  }

  // Assign variant (50/50 split)
  const variant = Math.random() < 0.5 ? 'A' : 'B'
  
  await supabase.from('ab_tests').insert({
    test_name: testName,
    user_id: userId,
    variant,
  })

  return variant
}

export async function trackConversion(testName: string, userId: string, value: number) {
  const variant = await getVariant(testName, userId)
  
  // Log to analytics
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: 'ab_test_conversion',
    properties: {
      test_name: testName,
      variant,
      value,
    },
  })
}
