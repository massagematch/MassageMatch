import { useState, useRef, useCallback } from 'react'
import { OptimizedImage } from '@/components/OptimizedImage'
import './SwipeCard.css'

const IMAGE_SWIPE_THRESHOLD = 50

export type SwipeCardProfile = {
  id: string
  name: string
  image_url: string | null
  images?: string[] | null
  bio?: string | null
  location_city?: string | null
  location_lat?: number | null
  location_lng?: number | null
  share_location?: boolean
  verified_photo?: boolean
  distance_km?: number
  rating_avg?: number
}

type Props = {
  profile: SwipeCardProfile
  isTop: boolean
  dragX: number
  onDragStart: (clientX: number) => void
  onDragMove: (clientX: number) => void
  onDragEnd: () => void
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onUnlock: () => void
}

function getImages(p: SwipeCardProfile): string[] {
  const arr = p.images && Array.isArray(p.images) ? p.images : []
  if (arr.length > 0) return arr.slice(0, 5)
  if (p.image_url) return [p.image_url]
  return [''] /* placeholder so counter shows 1/1 */
}

export function SwipeCard(props: Props) {
  const { profile, isTop, dragX, onDragStart, onDragMove, onDragEnd, onSwipeLeft, onSwipeRight, onUnlock } = props
  const images = getImages(profile)
  const [currentImage, setCurrentImage] = useState(0)
  const touchStart = useRef({ x: 0, y: 0 })
  const imageSwiped = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      touchStart.current = { x: e.clientX, y: e.clientY }
      imageSwiped.current = false
      onDragStart(e.clientX)
    },
    [isTop, onDragStart]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      const dx = e.clientX - touchStart.current.x
      const dy = e.clientY - touchStart.current.y
      if (!imageSwiped.current && Math.abs(dx) > IMAGE_SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        imageSwiped.current = true
        if (dx > 0) setCurrentImage((i) => (i <= 0 ? 0 : i - 1))
        else setCurrentImage((i) => (i >= images.length - 1 ? images.length - 1 : i + 1))
      }
      onDragMove(e.clientX)
    },
    [isTop, images.length, onDragMove]
  )

  const handlePointerUp = useCallback(() => {
    if (!isTop) return
    onDragEnd()
  }, [isTop, onDragEnd])

  const goToImage = (i: number) => {
    setCurrentImage(Math.max(0, Math.min(i, images.length - 1)))
  }

  const rating = profile.rating_avg != null ? profile.rating_avg.toFixed(1) : null
  const dist = profile.distance_km != null ? profile.distance_km.toFixed(1) : null

  return (
    <div
      className={`swipe-card ${isTop ? 'swipe-card-top' : ''}`}
      style={isTop ? { transform: `translateX(${dragX}px)` } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="swipe-card-inner">
        <div className="swipe-card-images">
          {images.map((url, i) => (
            <div
              key={i}
              className="swipe-card-image-wrap"
              style={{ opacity: i === currentImage ? 1 : 0, zIndex: images.length - i }}
            >
              {url ? (
                <OptimizedImage src={url} alt="" className="swipe-card-image" lazy={false} />
              ) : (
                <div className="swipe-card-image swipe-card-placeholder" />
              )}
            </div>
          ))}
        </div>
        <div className="swipe-card-counter">
          {currentImage + 1}/{images.length}
        </div>
        <div className="swipe-card-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`swipe-card-dot ${i === currentImage ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); goToImage(i) }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
        <div className="swipe-card-overlay">
          <h2 className="swipe-card-name">{profile.name}</h2>
          {(rating || dist || profile.location_city) && (
            <p className="swipe-card-meta">
              {profile.verified_photo && <span className="verified">Verified ✓</span>}
              {rating != null && <span>⭐ {rating}</span>}
              {dist != null && <span> · {dist} km</span>}
              {profile.location_city && <span> · {profile.location_city}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="swipe-card-actions">
        <button type="button" className="swipe-action-btn pass" onClick={() => onSwipeLeft()} aria-label="Pass">❌</button>
        <button type="button" className="swipe-action-btn unlock" onClick={() => onUnlock()} aria-label="Unlock">⭐ Unlock</button>
        <button type="button" className="swipe-action-btn like" onClick={() => onSwipeRight()} aria-label="Like">❤️</button>
      </div>
    </div>
  )
}
