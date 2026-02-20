import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  locale?: 'en' | 'th'
}

export function SEOHead({
  title = 'MassageMatch Thailand - Connect with Trusted Therapists',
  description = 'Find and connect with trusted massage therapists and salongs in Thailand. Premium access, verified profiles, instant booking.',
  image = '/og-image.jpg',
  type = 'website',
  locale = 'en',
}: SEOHeadProps) {
  const location = useLocation()

  useEffect(() => {
    // Update meta tags
    document.title = title
    updateMetaTag('description', description)
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:image', image)
    updateMetaTag('og:type', type)
    updateMetaTag('og:url', window.location.href)
    updateMetaTag('og:locale', locale === 'th' ? 'th_TH' : 'en_US')
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image)

    // Hreflang tags
    const currentLang = locale
    const alternateLang = locale === 'en' ? 'th' : 'en'
    const currentUrl = window.location.href
    const alternateUrl = currentUrl.replace(`/${currentLang}/`, `/${alternateLang}/`)

    let hreflang = document.querySelector('link[rel="alternate"][hreflang]')
    if (!hreflang) {
      hreflang = document.createElement('link')
      hreflang.setAttribute('rel', 'alternate')
      document.head.appendChild(hreflang)
    }
    hreflang.setAttribute('hreflang', currentLang)
    hreflang.setAttribute('href', currentUrl)

    // Add alternate language
    let alternateHreflang = document.querySelector(`link[rel="alternate"][hreflang="${alternateLang}"]`)
    if (!alternateHreflang) {
      alternateHreflang = document.createElement('link')
      alternateHreflang.setAttribute('rel', 'alternate')
      document.head.appendChild(alternateHreflang)
    }
    alternateHreflang.setAttribute('hreflang', alternateLang)
    alternateHreflang.setAttribute('href', alternateUrl)
  }, [title, description, image, type, locale, location])

  return null
}

function updateMetaTag(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      meta.setAttribute('property', property)
    } else {
      meta.setAttribute('name', property)
    }
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}
