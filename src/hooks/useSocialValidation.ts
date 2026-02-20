import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type ValidationResult = {
  valid: boolean
  exists?: boolean
  message: string
}

type ValidationResults = {
  instagram?: ValidationResult
  telegram?: ValidationResult
  whatsapp?: ValidationResult
  line?: ValidationResult
  facebook?: ValidationResult
}

type LoadingState = {
  instagram: boolean
  telegram: boolean
  whatsapp: boolean
  line: boolean
  facebook: boolean
}

export function useSocialValidation() {
  const [validationResults, setValidationResults] = useState<ValidationResults>({})
  const [loading, setLoading] = useState<LoadingState>({
    instagram: false,
    telegram: false,
    whatsapp: false,
    line: false,
    facebook: false,
  })

  const validateSocial = useCallback(
    async (platform: keyof ValidationResults, value: string) => {
      if (!value?.trim()) {
        setValidationResults((prev) => ({
          ...prev,
          [platform]: { valid: false, message: 'Required' },
        }))
        return
      }

      setLoading((prev) => ({ ...prev, [platform]: true }))

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase.functions.invoke('validate-social', {
          body: { platform, handle: value.trim() },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        })

        if (error) {
          setValidationResults((prev) => ({
            ...prev,
            [platform]: { valid: false, message: 'Validation error. Try again later.' },
          }))
        } else {
          setValidationResults((prev) => ({
            ...prev,
            [platform]: data as ValidationResult,
          }))
        }
      } catch (e) {
        console.error('Validation error:', e)
        setValidationResults((prev) => ({
          ...prev,
          [platform]: { valid: false, message: 'Network error. Check connection.' },
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [platform]: false }))
      }
    },
    []
  )

  return { validateSocial, validationResults, loading }
}
