import { useState, useEffect, useRef } from 'react'
import { getOptimizedImageUrl } from '@/lib/imageOptimizer'
import './OptimizedImage.css'

interface OptimizedImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  lazy?: boolean
}

export function OptimizedImage({ src, alt, width, height, className, lazy = true }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const optimizedSrc = getOptimizedImageUrl(src, width)

  useEffect(() => {
    if (!lazy || !imgRef.current) {
      setLoaded(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy])

  if (error) {
    return (
      <div className={`optimized-image-placeholder ${className || ''}`} style={{ width, height }}>
        <span>No image</span>
      </div>
    )
  }

  return (
    <div className={`optimized-image-wrapper ${className || ''}`} style={{ width, height }}>
      {loaded && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onError={() => setError(true)}
          className="optimized-image"
        />
      )}
      {!loaded && (
        <div className="optimized-image-skeleton">
          <div className="skeleton-shimmer" />
        </div>
      )}
    </div>
  )
}
