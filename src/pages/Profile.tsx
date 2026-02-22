import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSocialValidation } from '@/hooks/useSocialValidation'
import { LocationSelector, type LocationValue } from '@/components/LocationSelector'
import { MapButton } from '@/components/MapButton'
import { PlanTimer } from '@/components/PlanTimer'
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
  const [location, setLocation] = useState<LocationValue>({ region: '', city: '', area: '' })
  const [shareLocation, setShareLocation] = useState(false)
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [verifying, setVerifying] = useState(false)
  const [profileTab, setProfileTab] = useState<'images' | 'location' | 'bio' | 'prices' | 'services'>('location')
  const [bio, setBio] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [thb60min, setThb60min] = useState<string>('')
  const [thb90min, setThb90min] = useState<string>('')
  const [customerImages, setCustomerImages] = useState<string[]>([])
  const [customerImagesUploading, setCustomerImagesUploading] = useState(false)
  const { validateSocial, validationResults, loading: validating } = useSocialValidation()
  const verifiedPhoto = (profile as { verified_photo?: boolean })?.verified_photo ?? false

  const SERVICE_OPTIONS = ['Swedish massage', 'Thai massage', 'Hot stone', 'Aromatherapy', 'Deep tissue', 'Sports massage']

  useEffect(() => {
    if (profile?.social_links) {
      setSocialLinks((profile.social_links as SocialLinks) || {})
    }
    if (profile) {
      setLocation({
        region: (profile as { location_region?: string }).location_region ?? '',
        city: (profile as { location_city?: string }).location_city ?? '',
        area: (profile as { location_area?: string }).location_area ?? '',
      })
      setShareLocation((profile as { share_location?: boolean }).share_location ?? false)
      setLocationLat((profile as { location_lat?: number }).location_lat ?? null)
      setLocationLng((profile as { location_lng?: number }).location_lng ?? null)
      setBio((profile as { bio?: string }).bio ?? '')
      setServices(Array.isArray((profile as { services?: string[] }).services) ? (profile as { services?: string[] }).services! : [])
      const p = (profile as { prices?: { thb60min?: number; thb90min?: number } }).prices
      setThb60min(p?.thb60min != null ? String(p.thb60min) : '')
      setThb90min(p?.thb90min != null ? String(p.thb90min) : '')
      setCustomerImages(Array.isArray((profile as { customer_images?: string[] }).customer_images) ? (profile as { customer_images?: string[] }).customer_images! : [])
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
          location_region: location.region || null,
          location_city: location.city || null,
          location_area: location.area || null,
          location_lat: locationLat,
          location_lng: locationLng,
          share_location: shareLocation,
          bio: bio.trim() || null,
          services: services.length ? services : null,
          prices: { thb60min: thb60min ? parseInt(thb60min, 10) : null, thb90min: thb90min ? parseInt(thb90min, 10) : null },
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
        if (profile?.role === 'therapist') {
          await supabase.from('therapists').update({
            bio: bio.trim() || null,
            services: services.length ? services : null,
            prices: { thb60min: thb60min ? parseInt(thb60min, 10) : null, thb90min: thb90min ? parseInt(thb90min, 10) : null },
          }).eq('id', user.id)
        }
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
  }, [user?.id, socialLinks, validationResults, profile, refetchProfile, location, locationLat, locationLng, shareLocation, bio, services, thb60min, thb90min])

  const canSave =
    (Object.values(socialLinks).some((v) => v?.trim()) || location.region || bio.trim() || services.length > 0 || thb60min || thb90min) &&
    Object.entries(socialLinks).every(([platform, value]) => {
      if (!value?.trim()) return true
      const result = validationResults[platform as keyof SocialLinks]
      return !result || result.valid
    })

  const handleVerifyPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setVerifying(true)
    try {
      const path = `${user.id}/verification.${file.name.split('.').pop() || 'jpg'}`
      const { error: upErr } = await supabase.storage.from('therapist-images').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      await supabase.from('profiles').update({ verified_photo: true, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      if (profile?.role === 'therapist') {
        await supabase.from('therapists').update({ verified_photo: true }).eq('id', user.id)
      }
      await refetchProfile()
    } catch (err) {
      console.error('Verify photo failed:', err)
    } finally {
      setVerifying(false)
      e.target.value = ''
    }
  }

  const handleShareLocationToggle = () => {
    if (!shareLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationLat(pos.coords.latitude)
          setLocationLng(pos.coords.longitude)
          setShareLocation(true)
        },
        () => setShareLocation(true)
      )
    } else {
      setShareLocation(!shareLocation)
    }
  }

  const toggleService = (s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const handleAddCustomerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id || customerImages.length >= 5) return
    setCustomerImagesUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('customer-photos').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('customer-photos').getPublicUrl(path)
      const newUrls = [...customerImages, urlData.publicUrl]
      setCustomerImages(newUrls)
      await supabase.from('profiles').update({ customer_images: newUrls, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      await refetchProfile()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setCustomerImagesUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveCustomerImage = async (index: number) => {
    if (!user?.id) return
    const newUrls = customerImages.filter((_, i) => i !== index)
    setCustomerImages(newUrls)
    await supabase.from('profiles').update({ customer_images: newUrls, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    await refetchProfile()
  }

  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <p className="profile-subtitle">Edit your profile</p>
      {(profile?.role === 'therapist' || profile?.role === 'salong') && (
        <div className="profile-plan-timer">
          <PlanTimer type="plan" />
          <PlanTimer type="boost" />
          {profile?.plan_expires && new Date(profile.plan_expires) <= new Date() && (
            <p className="profile-expired-hint">Premium expired. You won&apos;t appear in swipe/search until you renew on <a href="/pricing">Pricing</a>.</p>
          )}
        </div>
      )}

      <div className="profile-tabs">
        <button type="button" className={profileTab === 'images' ? 'active' : ''} onClick={() => setProfileTab('images')}>📸 Bilder</button>
        <button type="button" className={profileTab === 'location' ? 'active' : ''} onClick={() => setProfileTab('location')}>📍 Location</button>
        <button type="button" className={profileTab === 'bio' ? 'active' : ''} onClick={() => setProfileTab('bio')}>✏️ Bio</button>
        <button type="button" className={profileTab === 'prices' ? 'active' : ''} onClick={() => setProfileTab('prices')}>💰 Priser</button>
        <button type="button" className={profileTab === 'services' ? 'active' : ''} onClick={() => setProfileTab('services')}>⭐ Services</button>
      </div>

      {profileTab === 'images' && (
      <section className="profile-section profile-verify">
        {profile?.role === 'customer' && (
          <>
            <h2 className="profile-section-title">Profile photos (1–5)</h2>
            <p className="profile-images-hint">These are shown when therapists swipe. Add 1–5 photos.</p>
            <div className="profile-customer-images">
              {customerImages.map((url, i) => (
                <div key={url} className="profile-customer-image-wrap">
                  <img src={url} alt={`Photo ${i + 1}`} className="profile-customer-image" />
                  <button type="button" className="profile-customer-image-remove" onClick={() => handleRemoveCustomerImage(i)} aria-label="Remove">×</button>
                </div>
              ))}
              {customerImages.length < 5 && (
                <label className="profile-customer-image-add">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAddCustomerImage} disabled={customerImagesUploading} hidden />
                  {customerImagesUploading ? 'Uploading…' : '+'}
                </label>
              )}
            </div>
          </>
        )}
        <h2 className="profile-section-title">Photo verification</h2>
        {verifiedPhoto ? (
          <p className="verified-label"><span className="verified-badge">Verified ✓</span> Your photo is verified.</p>
        ) : (
          <div>
            <label className="btn-verify-photo">
              <input type="file" accept="image/*" capture="user" onChange={handleVerifyPhoto} disabled={verifying} hidden />
              {verifying ? 'Uploading…' : 'Verify Photo'}
            </label>
            <p className="verify-hint">Upload a selfie to get the Verified badge (+25% trust).</p>
          </div>
        )}
      </section>
      )}

      {profileTab === 'location' && (
      <section className="profile-section">
        <h2 className="profile-section-title">📍 Location (Thailand)</h2>
        <LocationSelector value={location} onChange={setLocation} />
        {(profile?.role === 'therapist' || profile?.role === 'salong') && (
          <div className="share-location-row">
            <label className="share-location-label">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={handleShareLocationToggle}
              />
              Share location with customers (show on map)
            </label>
            {shareLocation && locationLat != null && locationLng != null && (
              <MapButton lat={locationLat} lng={locationLng} label="Open in Maps" />
            )}
            {shareLocation && (locationLat == null || locationLng == null) && (
              <span className="location-private-hint">Allow browser location to set coordinates</span>
            )}
          </div>
        )}
        {profile?.role === 'customer' && location.region && (
          <p className="location-display">
            📍 {location.region} → {location.city} {location.area && `→ ${location.area}`}
          </p>
        )}
      </section>
      )}

      {profileTab === 'bio' && (
      <section className="profile-section">
        <h2 className="profile-section-title">✏️ Bio</h2>
        <textarea
          className="profile-bio-input"
          placeholder="Write a short bio..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
        />
      </section>
      )}

      {profileTab === 'prices' && (
      <section className="profile-section">
        <h2 className="profile-section-title">💰 Priser (THB)</h2>
        <div className="profile-prices">
          <label>
            <span>60 min</span>
            <input type="number" min={0} placeholder="500" value={thb60min} onChange={(e) => setThb60min(e.target.value)} />
          </label>
          <label>
            <span>90 min</span>
            <input type="number" min={0} placeholder="700" value={thb90min} onChange={(e) => setThb90min(e.target.value)} />
          </label>
        </div>
      </section>
      )}

      {profileTab === 'services' && (
      <section className="profile-section">
        <h2 className="profile-section-title">⭐ Services</h2>
        <div className="profile-services">
          {SERVICE_OPTIONS.map((s) => (
            <label key={s} className="profile-service-check">
              <input type="checkbox" checked={services.includes(s)} onChange={() => toggleService(s)} />
              {s}
            </label>
          ))}
        </div>
      </section>
      )}

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
