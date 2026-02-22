import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const TEST_NAME = 'premium_12h_price'

export function useABTest(userId: string | undefined): 'A' | 'B' {
  const [variant, setVariant] = useState<'A' | 'B'>('A')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const { data: existing } = await supabase
        .from('ab_tests')
        .select('variant')
        .eq('test_name', TEST_NAME)
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      if (existing?.variant === 'A' || existing?.variant === 'B') {
        setVariant(existing.variant as 'A' | 'B')
        return
      }
      const assign = Math.random() < 0.5 ? 'A' : 'B'
      await supabase.from('ab_tests').upsert(
        { test_name: TEST_NAME, user_id: userId, variant: assign },
        { onConflict: 'test_name,user_id' }
      )
      if (!cancelled) setVariant(assign)
    })()
    return () => { cancelled = true }
  }, [userId])

  return variant
}
