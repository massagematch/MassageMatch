import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSocialValidation } from '@/hooks/useSocialValidation'
import { trackEvent } from '@/lib/analytics'
import './Profile.css'

type SocialLinks = {
  instagram?: string
  telegram?: string
  whatsapp?: string
  line?: string
  facebook?: string
}

export default function Profile() {
  const { user, profile, refetchProfile } = useAuth()
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { validateSocial, validationResults, loading: validating } = useSocialValidation()

  useEffect(() => {
    if (profile?.social_links) {
      setSocialLinks((profile.social_links as SocialLinks) || {})
    }
  }, [profile])

  const handleSocialChange = async (platform: keyof SocialLinks, value: string) => {
    const updated = { ...socialLinks, [platform]: value }
    setSocialLinks(updated)
    
    // Validate on blur (when user finishes typing)
    if (value.trim()) {
      await validateSocial(platform, value)
    }
  }

  const handleSaveSocial = useCallback(async () => {
    if (!user?.id) return
    
    // Check if all filled fields are valid
    const filledPlatforms = Object.entries(socialLinks).filter(([_, v]) => v?.trim())
    const invalidPlatforms = filledPlatforms.filter(([platform]) => {
      const result = validationResults[platform as keyof SocialLinks]
      return result && !result.valid
    })
    
    if (invalidPlatforms.length > 0) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return
    }

    setSaving(true)
    setSaveStatus('idle')
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          social_links: socialLinks,
          social_validation: validationResults,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Save failed:', error)
        setSaveStatus('error')
        trackEvent('profile_save_error', { error: error.message })
      } else {
        setSaveStatus('success')
        trackEvent('profile_save_success', { platforms: Object.keys(socialLinks) })
        await refetchProfile()
        
        // Trigger welcome email if profile just completed
        if (profile && !profile.social_links && Object.keys(socialLinks).length > 0) {
          try {
            await supabase.functions.invoke('send-welcome', {
              body: { user_id: user.id, trigger: 'profile_completed' },
            })
          } catch (e) {
            console.error('Welcome email failed:', e)
          }
        }
      }
    } catch (e) {
      console.error('Save error:', e)
      setSaveStatus('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [user?.id, socialLinks, validationResults, profile, refetchProfile])

  const canSave = Object.values(socialLinks).some((v) => v?.trim()) && 
    Object.entries(socialLinks).every(([platform, value]) => {
      if (!value?.trim()) return true // Empty is OK
      const result = validationResults[platform as keyof SocialLinks]
      return !result || result.valid
    })

  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <p className="profile-subtitle">Add your social media contacts so customers can reach you</p>

      <div className="social-form">
        <div className="social-field-group">
          <label htmlFor="instagram">
            <span className="social-icon">📷</span>
            Instagram
          </label>
          <div className="social-input-wrapper">
            <input
              id="instagram"
              type="text"
              placeholder="@username"
              value={socialLinks.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              onBlur={() => socialLinks.instagram && validateSocial('instagram', socialLinks.instagram)}
              className={`social-input ${validationResults.instagram?.valid === false ? 'invalid' : ''} ${validationResults.instagram?.valid === true ? 'valid' : ''}`}
            />
            {validating.instagram && <span className="validation-spinner">⏳</span>}
            {validationResults.instagram && !validating.instagram && (
              <span className={`validation-icon ${validationResults.instagram.valid ? 'valid' : 'invalid'}`}>
                {validationResults.instagram.valid ? '✅' : '❌'}
              </span>
            )}
          </div>
          {validationResults.instagram?.message && (
            <span className={`validation-message ${validationResults.instagram.valid ? 'valid' : 'invalid'}`}>
              {validationResults.instagram.message}
            </span>
          )}
        </div>

        <div className="social-field-group">
          <label htmlFor="telegram">
            <span className="social-icon">✈️</span>
            Telegram
          </label>
          <div className="social-input-wrapper">
            <input
              id="telegram"
              type="text"
              placeholder="@username or t.me/username"
              value={socialLinks.telegram || ''}
              onChange={(e) => handleSocialChange('telegram', e.target.value)}
              onBlur={() => socialLinks.telegram && validateSocial('telegram', socialLinks.telegram)}
              className={`social-input ${validationResults.telegram?.valid === false ? 'invalid' : ''} ${validationResults.telegram?.valid === true ? 'valid' : ''}`}
            />
            {validating.telegram && <span className="validation-spinner">⏳</span>}
            {validationResults.telegram && !validating.telegram && (
              <span className={`validation-icon ${validationResults.telegram.valid ? 'valid' : 'invalid'}`}>
                {validationResults.telegram.valid ? '✅' : '❌'}
              </span>
            )}
          </div>
          {validationResults.telegram?.message && (
            <span className={`validation-message ${validationResults.telegram.valid ? 'valid' : 'invalid'}`}>
              {validationResults.telegram.message}
            </span>
          )}
        </div>

        <div className="social-field-group">
          <label htmlFor="whatsapp">
            <span className="social-icon">💬</span>
            WhatsApp
          </label>
          <div className="social-input-wrapper">
            <input
              id="whatsapp"
              type="text"
              placeholder="+66xxxxxxxxx"
              value={socialLinks.whatsapp || ''}
              onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
              onBlur={() => socialLinks.whatsapp && validateSocial('whatsapp', socialLinks.whatsapp)}
              className={`social-input ${validationResults.whatsapp?.valid === false ? 'invalid' : ''} ${validationResults.whatsapp?.valid === true ? 'valid' : ''}`}
            />
            {validating.whatsapp && <span className="validation-spinner">⏳</span>}
            {validationResults.whatsapp && !validating.whatsapp && (
              <span className={`validation-icon ${validationResults.whatsapp.valid ? 'valid' : 'invalid'}`}>
                {validationResults.whatsapp.valid ? '✅' : '❌'}
              </span>
            )}
          </div>
          {validationResults.whatsapp?.message && (
            <span className={`validation-message ${validationResults.whatsapp.valid ? 'valid' : 'invalid'}`}>
              {validationResults.whatsapp.message}
            </span>
          )}
        </div>

        <div className="social-field-group">
          <label htmlFor="line">
            <span className="social-icon">💚</span>
            Line
          </label>
          <div className="social-input-wrapper">
            <input
              id="line"
              type="text"
              placeholder="line_id"
              value={socialLinks.line || ''}
              onChange={(e) => handleSocialChange('line', e.target.value)}
              onBlur={() => socialLinks.line && validateSocial('line', socialLinks.line)}
              className={`social-input ${validationResults.line?.valid === false ? 'invalid' : ''} ${validationResults.line?.valid === true ? 'valid' : ''}`}
            />
            {validating.line && <span className="validation-spinner">⏳</span>}
            {validationResults.line && !validating.line && (
              <span className={`validation-icon ${validationResults.line.valid ? 'valid' : 'invalid'}`}>
                {validationResults.line.valid ? '✅' : '❌'}
              </span>
            )}
          </div>
          {validationResults.line?.message && (
            <span className={`validation-message ${validationResults.line.valid ? 'valid' : 'invalid'}`}>
              {validationResults.line.message}
            </span>
          )}
        </div>

        <div className="social-field-group">
          <label htmlFor="facebook">
            <span className="social-icon">👤</span>
            Facebook
          </label>
          <div className="social-input-wrapper">
            <input
              id="facebook"
              type="text"
              placeholder="fb.me/username or username"
              value={socialLinks.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              onBlur={() => socialLinks.facebook && validateSocial('facebook', socialLinks.facebook)}
              className={`social-input ${validationResults.facebook?.valid === false ? 'invalid' : ''} ${validationResults.facebook?.valid === true ? 'valid' : ''}`}
            />
            {validating.facebook && <span className="validation-spinner">⏳</span>}
            {validationResults.facebook && !validating.facebook && (
              <span className={`validation-icon ${validationResults.facebook.valid ? 'valid' : 'invalid'}`}>
                {validationResults.facebook.valid ? '✅' : '❌'}
              </span>
            )}
          </div>
          {validationResults.facebook?.message && (
            <span className={`validation-message ${validationResults.facebook.valid ? 'valid' : 'invalid'}`}>
              {validationResults.facebook.message}
            </span>
          )}
        </div>
      </div>

      <button
        className={`save-social-button ${saving ? 'saving' : ''} ${saveStatus === 'success' ? 'success' : ''} ${saveStatus === 'error' ? 'error' : ''}`}
        onClick={handleSaveSocial}
        disabled={saving || !canSave}
      >
        {saving ? (
          <>⏳ Saving...</>
        ) : saveStatus === 'success' ? (
          <>✅ Social Contacts Saved!</>
        ) : saveStatus === 'error' ? (
          <>❌ Save Failed. Try Again</>
        ) : (
          <>💾 Save Social Contacts</>
        )}
      </button>

      {saveStatus === 'success' && (
        <div className="save-toast success">
          ✅ Social contacts saved! Visible to customers now.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="save-toast error">
          ❌ Save failed. Check internet connection and try again.
        </div>
      )}
    </div>
  )
}
